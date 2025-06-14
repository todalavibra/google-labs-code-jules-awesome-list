from typing import List, TYPE_CHECKING, Dict, Set, Tuple, Union
from architecture import Application, Service, Database, NetworkZone, Component

class ThreatActor:
    def __init__(self, name: str, skill_level: str, motivation: str):
        self.name: str = name
        self.skill_level: str = skill_level
        self.motivation: str = motivation

class AttackVector:
    def __init__(self, name: str, description: str, target_components: List[str]):
        self.name: str = name
        self.description: str = description
        self.target_components: List[str] = target_components

class Vulnerability:
    def __init__(self, name: str, description: str, attack_vector: AttackVector, affected_components: List[str], severity: str):
        self.name: str = name
        self.description: str = description
        self.attack_vector: AttackVector = attack_vector
        self.affected_components: List[str] = affected_components
        self.severity: str = severity

class SecurityControl:
    def __init__(self, name: str, description: str, mitigates: List[AttackVector], cost_to_implement: str, effectiveness: str):
        self.name: str = name
        self.description: str = description
        self.mitigates: List[AttackVector] = mitigates
        self.cost_to_implement: str = cost_to_implement
        self.effectiveness: str = effectiveness

class IdentifiedAttackSurface:
    def __init__(self, component_name: str, component_type: str, network_zone: str, reason: str):
        self.component_name: str = component_name
        self.component_type: str = component_type
        self.network_zone: str = network_zone
        self.reason: str = reason
        self.potential_vulnerabilities: List[Vulnerability] = []

def identify_attack_surfaces(application: Application, known_vulnerabilities: List[Vulnerability]) -> List[IdentifiedAttackSurface]:
    identified_surfaces_map: Dict[str, IdentifiedAttackSurface] = {}

    def add_or_update_surface(comp: Union[Service, Database], comp_type: str, reason_text: str):
        surface = identified_surfaces_map.get(comp.name)
        if surface:
            if reason_text not in surface.reason:
                surface.reason += f"; {reason_text}"
        else:
            surface = IdentifiedAttackSurface(
                component_name=comp.name,
                component_type=comp_type,
                network_zone=comp.network_zone.name,
                reason=reason_text
            )
            identified_surfaces_map[comp.name] = surface
        return surface

    for service in application.services:
        if service.network_zone.name.lower() == "public":
            add_or_update_surface(service, "Service", "Publicly exposed service")

        if service.processes_sensitive_data:
            add_or_update_surface(service, "Service", "Handles sensitive data")

    for db in application.databases:
        if db.stores_sensitive_data:
            add_or_update_surface(db, "Database", "Stores sensitive data")

    for surface in identified_surfaces_map.values():
        for vuln in known_vulnerabilities:
            if not vuln.affected_components or surface.component_name in vuln.affected_components:
                if vuln not in surface.potential_vulnerabilities:
                    surface.potential_vulnerabilities.append(vuln)
                continue
            if surface.component_type in vuln.attack_vector.target_components:
                if vuln not in surface.potential_vulnerabilities:
                    surface.potential_vulnerabilities.append(vuln)

    return list(identified_surfaces_map.values())

class SuggestedControl:
    def __init__(self, control: SecurityControl, reason_for_suggestion: str, applies_to_surface: IdentifiedAttackSurface):
        self.control: SecurityControl = control
        self.reason_for_suggestion: str = reason_for_suggestion
        self.applies_to_surface: IdentifiedAttackSurface = applies_to_surface

def suggest_security_controls(attack_surfaces: List[IdentifiedAttackSurface], available_controls: List[SecurityControl]) -> List[SuggestedControl]:
    suggested_controls_list: List[SuggestedControl] = []
    # Keep track of (control_name, surface_component_name) to avoid duplicates
    added_suggestions: Set[Tuple[str, str]] = set()

    for surface in attack_surfaces:
        for vulnerability in surface.potential_vulnerabilities:
            for control in available_controls:
                # Check if the control mitigates the vulnerability's attack vector
                if vulnerability.attack_vector in control.mitigates:
                    suggestion_key = (control.name, surface.component_name)
                    if suggestion_key not in added_suggestions:
                        reason = (f"Mitigates '{vulnerability.attack_vector.name}' "
                                  f"which is a potential vulnerability for '{surface.component_name}' "
                                  f"({surface.component_type}) due to '{vulnerability.name}'.")

                        suggested_control = SuggestedControl(
                            control=control,
                            reason_for_suggestion=reason,
                            applies_to_surface=surface
                        )
                        suggested_controls_list.append(suggested_control)
                        added_suggestions.add(suggestion_key)
                        # As per requirement, pick the reason from the first vulnerability that matched.
                        # So, if a control is added for a surface, we don't need to check other vulnerabilities on that surface *for that specific control*.
                        # However, the current loop structure will continue to check other controls for the same vulnerability.
                        # And other vulnerabilities for the same surface. This is correct.
                        # The `added_suggestions` check ensures one control is listed once per surface.

    return suggested_controls_list
