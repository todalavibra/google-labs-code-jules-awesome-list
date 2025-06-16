from typing import List, TYPE_CHECKING, Dict, Set, Tuple, Union, Optional
from architecture import Application, Service, Database, NetworkZone, Component

class ThreatActor:
    def __init__(self,
                 name: str,
                 skill_level: str,
                 motivation: str,
                 resources: str,
                 likely_targets: List[str],
                 attack_history: Optional[List[str]] = None):
        self.name: str = name
        self.skill_level: str = skill_level
        self.motivation: str = motivation
        self.resources: str = resources
        self.likely_targets: List[str] = likely_targets
        self.attack_history: List[str] = attack_history if attack_history is not None else []

class AttackVector:
    def __init__(self,
                 name: str,
                 description: str,
                 target_components: List[str],
                 ease_of_exploitation: str,
                 required_privileges: str,
                 mitigation_complexity: str,
                 cwe_id: str = ""):
        self.name: str = name
        self.description: str = description
        self.target_components: List[str] = target_components
        self.cwe_id: str = cwe_id
        self.ease_of_exploitation: str = ease_of_exploitation
        self.required_privileges: str = required_privileges
        self.mitigation_complexity: str = mitigation_complexity

class Vulnerability:
    def __init__(self,
                 name: str,
                 description: str,
                 attack_vector: AttackVector,
                 affected_components: List[str],
                 severity: str,
                 exploitability: str,
                 impact_description: str,
                 cve_id: str = "",
                 cvss_score: Optional[float] = None):
        self.name: str = name
        self.description: str = description
        self.attack_vector: AttackVector = attack_vector
        self.affected_components: List[str] = affected_components
        self.severity: str = severity
        self.cve_id: str = cve_id
        self.cvss_score: Optional[float] = cvss_score
        self.exploitability: str = exploitability
        self.impact_description: str = impact_description

class SecurityControl:
    def __init__(self,
                 name: str,
                 description: str,
                 mitigates: List[AttackVector],
                 cost_to_implement: str,
                 effectiveness: str,
                 implementation_status: str,
                 owner: str,
                 related_vulnerabilities: Optional[List[str]] = None,
                 residual_risk: str = "Not Assessed"):
        self.name: str = name
        self.description: str = description
        self.mitigates: List[AttackVector] = mitigates
        self.cost_to_implement: str = cost_to_implement
        self.effectiveness: str = effectiveness
        self.implementation_status: str = implementation_status
        self.owner: str = owner
        self.related_vulnerabilities: List[str] = related_vulnerabilities if related_vulnerabilities is not None else []
        self.residual_risk: str = residual_risk

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
                suggestion_key = (control.name, surface.component_name)
                if suggestion_key in added_suggestions:
                    continue  # This control has already been suggested for this surface

                reason = ""
                matched = False

                # Primary Matching Logic: Specific Vulnerabilities
                if control.related_vulnerabilities:
                    if vulnerability.name in control.related_vulnerabilities or \
                       (vulnerability.cve_id and vulnerability.cve_id in control.related_vulnerabilities):
                        cvss_str = f"{vulnerability.cvss_score}" if vulnerability.cvss_score is not None else "N/A"
                        cve_str = vulnerability.cve_id if vulnerability.cve_id else "N/A"
                        reason = (f"Mitigates specific vulnerability '{vulnerability.name}' "
                                  f"(CVE: {cve_str}, CVSS: {cvss_str}, Severity: {vulnerability.severity}) found on '{surface.component_name}'. "
                                  f"Control Status: {control.implementation_status}, Owner: {control.owner}, Effectiveness: {control.effectiveness}, Residual Risk: {control.residual_risk}.")
                        matched = True

                # Secondary Matching Logic: Attack Vectors (if not matched by specific vulnerability)
                if not matched and vulnerability.attack_vector in control.mitigates:
                    cvss_str = f"{vulnerability.cvss_score}" if vulnerability.cvss_score is not None else "N/A"
                    cve_str = vulnerability.cve_id if vulnerability.cve_id else "N/A"
                    reason = (f"Mitigates general attack vector '{vulnerability.attack_vector.name}' "
                              f"relevant to vulnerability '{vulnerability.name}' (CVE: {cve_str}, CVSS: {cvss_str}, Severity: {vulnerability.severity}) on '{surface.component_name}'. "
                              f"Control Status: {control.implementation_status}, Owner: {control.owner}, Effectiveness: {control.effectiveness}, Residual Risk: {control.residual_risk}.")
                    matched = True

                if matched:
                    suggested_control = SuggestedControl(
                        control=control,
                        reason_for_suggestion=reason,
                        applies_to_surface=surface
                    )
                    suggested_controls_list.append(suggested_control)
                    added_suggestions.add(suggestion_key)

    return suggested_controls_list

# --- YAML Loading for Threat Intelligence ---
import yaml
from typing import Any # Already have List, Dict, Tuple, Optional, Set, Union from above

def _get_required_key(data: Dict[str, Any], key: str, context: str) -> Any:
    val = data.get(key)
    if val is None:
        raise ValueError(f"Missing required key '{key}' in a {context} entry: {data}")
    return val

def _get_optional_key(data: Dict[str, Any], key: str, default: Any = None) -> Any:
    return data.get(key, default)

def _parse_threat_actors(actor_data_list: List[Dict[str, Any]]) -> List[ThreatActor]:
    actors = []
    if not isinstance(actor_data_list, list):
        raise ValueError("Threat actors data must be a list.")
    for i, data in enumerate(actor_data_list):
        if not isinstance(data, dict):
            raise ValueError(f"Threat actor entry at index {i} must be a dictionary.")
        try:
            name = _get_required_key(data, "name", "threat_actor")
            skill_level = _get_required_key(data, "skill_level", "threat_actor")
            motivation = _get_required_key(data, "motivation", "threat_actor")
            resources = _get_required_key(data, "resources", "threat_actor")
            likely_targets = _get_required_key(data, "likely_targets", "threat_actor")
            if not isinstance(likely_targets, list):
                raise ValueError(f"'likely_targets' must be a list for threat_actor '{name}'.")

            attack_history = _get_optional_key(data, "attack_history")
            if attack_history is not None and not isinstance(attack_history, list):
                 raise ValueError(f"'attack_history' must be a list if provided for threat_actor '{name}'.")

            actors.append(ThreatActor(
                name=str(name),
                skill_level=str(skill_level),
                motivation=str(motivation),
                resources=str(resources),
                likely_targets=[str(t) for t in likely_targets],
                attack_history=[str(h) for h in attack_history] if attack_history else None
            ))
        except ValueError as e:
            raise ValueError(f"Error parsing threat_actor at index {i}: {data} - {e}")
    return actors

def _parse_attack_vectors(vector_data_list: List[Dict[str, Any]]) -> List[AttackVector]:
    vectors = []
    if not isinstance(vector_data_list, list):
        raise ValueError("Attack vectors data must be a list.")
    for i, data in enumerate(vector_data_list):
        if not isinstance(data, dict):
            raise ValueError(f"Attack vector entry at index {i} must be a dictionary.")
        try:
            name = _get_required_key(data, "name", "attack_vector")
            description = _get_required_key(data, "description", "attack_vector")
            target_components = _get_required_key(data, "target_components", "attack_vector")
            if not isinstance(target_components, list):
                raise ValueError(f"'target_components' must be a list for attack_vector '{name}'.")

            ease_of_exploitation = _get_required_key(data, "ease_of_exploitation", "attack_vector")
            required_privileges = _get_required_key(data, "required_privileges", "attack_vector")
            mitigation_complexity = _get_required_key(data, "mitigation_complexity", "attack_vector")
            cwe_id = _get_optional_key(data, "cwe_id", "")

            vectors.append(AttackVector(
                name=str(name),
                description=str(description),
                target_components=[str(tc) for tc in target_components],
                ease_of_exploitation=str(ease_of_exploitation),
                required_privileges=str(required_privileges),
                mitigation_complexity=str(mitigation_complexity),
                cwe_id=str(cwe_id)
            ))
        except ValueError as e:
            raise ValueError(f"Error parsing attack_vector at index {i}: {data} - {e}")
    return vectors

def _parse_vulnerabilities(vuln_data_list: List[Dict[str, Any]], all_attack_vectors: List[AttackVector]) -> List[Vulnerability]:
    vulnerabilities = []
    if not isinstance(vuln_data_list, list):
        raise ValueError("Vulnerabilities data must be a list.")

    attack_vector_map = {av.name: av for av in all_attack_vectors}

    for i, data in enumerate(vuln_data_list):
        if not isinstance(data, dict):
            raise ValueError(f"Vulnerability entry at index {i} must be a dictionary.")
        try:
            name = _get_required_key(data, "name", "vulnerability")
            description = _get_required_key(data, "description", "vulnerability")
            attack_vector_name = _get_required_key(data, "attack_vector", "vulnerability")

            attack_vector_obj = attack_vector_map.get(str(attack_vector_name))
            if not attack_vector_obj:
                raise ValueError(f"Attack vector '{attack_vector_name}' not found for vulnerability '{name}'.")

            affected_components = _get_required_key(data, "affected_components", "vulnerability")
            if not isinstance(affected_components, list):
                 raise ValueError(f"'affected_components' must be a list for vulnerability '{name}'.")

            severity = _get_required_key(data, "severity", "vulnerability")
            exploitability = _get_required_key(data, "exploitability", "vulnerability")
            impact_description = _get_required_key(data, "impact_description", "vulnerability")

            cve_id = _get_optional_key(data, "cve_id", "")
            cvss_score_val = _get_optional_key(data, "cvss_score")
            cvss_score = float(cvss_score_val) if cvss_score_val is not None else None


            vulnerabilities.append(Vulnerability(
                name=str(name),
                description=str(description),
                attack_vector=attack_vector_obj,
                affected_components=[str(ac) for ac in affected_components],
                severity=str(severity),
                exploitability=str(exploitability),
                impact_description=str(impact_description),
                cve_id=str(cve_id),
                cvss_score=cvss_score
            ))
        except ValueError as e:
            raise ValueError(f"Error parsing vulnerability at index {i}: {data} - {e}")
    return vulnerabilities

def _parse_security_controls(control_data_list: List[Dict[str, Any]], all_attack_vectors: List[AttackVector]) -> List[SecurityControl]:
    controls = []
    if not isinstance(control_data_list, list):
        raise ValueError("Security controls data must be a list.")

    attack_vector_map = {av.name: av for av in all_attack_vectors}

    for i, data in enumerate(control_data_list):
        if not isinstance(data, dict):
            raise ValueError(f"Security control entry at index {i} must be a dictionary.")
        try:
            name = _get_required_key(data, "name", "security_control")
            description = _get_required_key(data, "description", "security_control")
            mitigates_names = _get_required_key(data, "mitigates", "security_control")
            if not isinstance(mitigates_names, list):
                raise ValueError(f"'mitigates' must be a list for security_control '{name}'.")

            mitigates_objs = []
            for av_name in mitigates_names:
                av_obj = attack_vector_map.get(str(av_name))
                if not av_obj:
                    raise ValueError(f"Attack vector '{av_name}' in 'mitigates' not found for security_control '{name}'.")
                mitigates_objs.append(av_obj)

            cost_to_implement = _get_required_key(data, "cost_to_implement", "security_control")
            effectiveness = _get_required_key(data, "effectiveness", "security_control")
            implementation_status = _get_required_key(data, "implementation_status", "security_control")
            owner = _get_required_key(data, "owner", "security_control")

            related_vulnerabilities = _get_optional_key(data, "related_vulnerabilities")
            if related_vulnerabilities is not None and not isinstance(related_vulnerabilities, list):
                raise ValueError(f"'related_vulnerabilities' must be a list if provided for security_control '{name}'.")

            residual_risk = _get_optional_key(data, "residual_risk", "Not Assessed")

            controls.append(SecurityControl(
                name=str(name),
                description=str(description),
                mitigates=mitigates_objs,
                cost_to_implement=str(cost_to_implement),
                effectiveness=str(effectiveness),
                implementation_status=str(implementation_status),
                owner=str(owner),
                related_vulnerabilities=[str(rv) for rv in related_vulnerabilities] if related_vulnerabilities else None,
                residual_risk=str(residual_risk)
            ))
        except ValueError as e:
            raise ValueError(f"Error parsing security_control at index {i}: {data} - {e}")
    return controls


def load_threat_intelligence_from_yaml(file_path: str) -> Tuple[List[ThreatActor], List[AttackVector], List[Vulnerability], List[SecurityControl]]:
    try:
        with open(file_path, 'r') as f:
            raw_data = yaml.safe_load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"Error: Threat intelligence file not found at {file_path}")
    except yaml.YAMLError as e:
        raise yaml.YAMLError(f"Error: Invalid YAML format in {file_path}: {e}")

    if not isinstance(raw_data, dict):
        raise ValueError("Root of threat intelligence YAML must be a dictionary.")

    parsed_actors: List[ThreatActor] = []
    parsed_attack_vectors: List[AttackVector] = []
    parsed_vulnerabilities: List[Vulnerability] = []
    parsed_security_controls: List[SecurityControl] = []

    # Attack Vectors must be parsed first as they are referenced by others
    av_data = raw_data.get("attack_vectors")
    if av_data is not None:
        parsed_attack_vectors = _parse_attack_vectors(av_data)
    else:
        # Allow empty list if not defined, but good to have the key
        parsed_attack_vectors = []


    actor_data = raw_data.get("threat_actors")
    if actor_data is not None:
        parsed_actors = _parse_threat_actors(actor_data)

    vuln_data = raw_data.get("vulnerabilities")
    if vuln_data is not None:
        parsed_vulnerabilities = _parse_vulnerabilities(vuln_data, parsed_attack_vectors)

    control_data = raw_data.get("security_controls")
    if control_data is not None:
        parsed_security_controls = _parse_security_controls(control_data, parsed_attack_vectors)

    # Check for missing top-level keys (optional: could raise error or just return empty lists)
    # For now, if a key is missing, its corresponding list will be empty if not processed above.
    # If strict presence is required:
    # if "threat_actors" not in raw_data: raise ValueError("Missing 'threat_actors' key in YAML.")
    # if "attack_vectors" not in raw_data: raise ValueError("Missing 'attack_vectors' key in YAML.")
    # etc.

    return parsed_actors, parsed_attack_vectors, parsed_vulnerabilities, parsed_security_controls
