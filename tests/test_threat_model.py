import unittest
import os
import yaml
from typing import List, Optional # Ensure Optional is imported
from architecture import Application, Service, Database, NetworkZone
from threat_model import (
    ThreatActor, AttackVector, Vulnerability, SecurityControl,
    IdentifiedAttackSurface, SuggestedControl,
    identify_attack_surfaces, suggest_security_controls,
    load_threat_intelligence_from_yaml # Import the new loader
)

class TestThreatModel(unittest.TestCase):

    def setUp(self):
        # 1. Architecture Components
        self.public_zone = NetworkZone(name="public")
        self.private_zone = NetworkZone(name="private")
        self.dmz_zone = NetworkZone(name="dmz")

        self.web_service = Service(name="WebService", port=80, protocol="TCP", processes_sensitive_data=False, network_zone=self.public_zone)
        self.app_service = Service(name="AppService", port=8080, protocol="TCP", processes_sensitive_data=True, network_zone=self.private_zone)
        self.public_sensitive_service = Service(name="PublicSensitiveService", port=443, protocol="TCP", processes_sensitive_data=True, network_zone=self.public_zone)

        self.user_db = Database(name="UserDB", type="SQL", stores_sensitive_data=True, network_zone=self.private_zone)
        self.log_db = Database(name="LogDB", type="NoSQL", stores_sensitive_data=False, network_zone=self.private_zone)

        self.application = Application(
            services=[self.web_service, self.app_service, self.public_sensitive_service],
            databases=[self.user_db, self.log_db],
            network_zones=[self.public_zone, self.private_zone, self.dmz_zone]
        )

        # 2. Threat Modeling Components - Updated with new attributes
        self.ta_script_kiddie = ThreatActor(
            name="Script Kiddie", skill_level="Low", motivation="Curiosity",
            resources="Basic tools", likely_targets=["Public websites"], attack_history=["Defacement"]
        )

        self.av_sqli = AttackVector(
            name="SQL Injection", description="Injecting malicious SQL", target_components=["Database", "Service"],
            ease_of_exploitation="Medium", required_privileges="None", mitigation_complexity="Low", cwe_id="CWE-89"
        )
        self.av_xss = AttackVector(
            name="Cross-Site Scripting", description="Injecting scripts", target_components=["Service"],
            ease_of_exploitation="Easy", required_privileges="None", mitigation_complexity="Medium", cwe_id="CWE-79"
        )
        self.av_public_exploit = AttackVector(
            name="Public Exploit", description="Exploiting public services", target_components=["Service"],
            ease_of_exploitation="High", required_privileges="None", mitigation_complexity="High" # No CWE for this generic one
        )
        self.av_data_breach = AttackVector(
            name="Data Breach", description="Stealing sensitive data", target_components=["Database", "Service"],
            ease_of_exploitation="Varies", required_privileges="Varies", mitigation_complexity="High"
        )
        self.av_unpatched = AttackVector(
            name="Unpatched Software", description="Using known exploits", target_components=["Service", "Database"],
            ease_of_exploitation="Medium", required_privileges="None", mitigation_complexity="Low", cwe_id="CWE-1035" # Example for unpatched
        )

        self.vuln_generic_unpatched = Vulnerability(
            name="Generic Unpatched Lib", description="Old library in use", attack_vector=self.av_unpatched,
            affected_components=[], severity="Medium", exploitability="Easy", impact_description="Potential for various attacks.",
            cve_id="CVE-2022-XXXX", cvss_score=6.5
        )
        self.vuln_appservice_sqli = Vulnerability(
            name="AppService SQLi", description="SQLi in AppService login", attack_vector=self.av_sqli,
            affected_components=["AppService"], severity="High", exploitability="Moderate", impact_description="Auth bypass, data exfiltration.",
            cve_id="CVE-2023-1001", cvss_score=8.8
        )
        self.vuln_webservice_xss = Vulnerability(
            name="WebService XSS", description="XSS in WebService search", attack_vector=self.av_xss,
            affected_components=["WebService"], severity="Low", exploitability="Easy", impact_description="Session hijacking, defacement.",
            cve_id="CVE-2023-1002", cvss_score=4.3
        )
        self.vuln_userdb_breach = Vulnerability(
            name="UserDB Data Breach", description="UserDB data breach vector", attack_vector=self.av_data_breach,
            affected_components=["UserDB"], severity="Critical", exploitability="Hard", impact_description="Full PII exposure.",
            cve_id="CVE-2023-1003", cvss_score=9.8
        )
        self.vuln_service_public_exploit = Vulnerability( # Renamed for clarity
            name="Public Service Exploit", description="Generic public service exploit", attack_vector=self.av_public_exploit,
            affected_components=[], severity="Medium", exploitability="Easy", impact_description="Service disruption or unauthorized access.",
            cve_id="CVE-2023-1004", cvss_score=7.5 # Assuming it targets all services due to empty affected_components in AV
        )

        self.known_vulnerabilities: List[Vulnerability] = [
            self.vuln_generic_unpatched, self.vuln_appservice_sqli, self.vuln_webservice_xss,
            self.vuln_userdb_breach, self.vuln_service_public_exploit
        ]

        self.sc_input_validation = SecurityControl(
            name="Input Validation", description="Sanitize all inputs", mitigates=[self.av_sqli, self.av_xss],
            cost_to_implement="Medium", effectiveness="High", implementation_status="Implemented",
            owner="Dev Team", related_vulnerabilities=["AppService SQLi", "WebService XSS"], residual_risk="Low"
        )
        self.sc_patching = SecurityControl(
            name="Regular Patching", description="Keep software updated", mitigates=[self.av_unpatched],
            cost_to_implement="Medium", effectiveness="High", implementation_status="Planned",
            owner="Ops Team", residual_risk="Medium" # No specific vuln, mitigates a vector
        )
        self.sc_firewall = SecurityControl(
            name="Firewall", description="Network traffic filtering", mitigates=[self.av_public_exploit],
            cost_to_implement="Low", effectiveness="Medium", implementation_status="Implemented",
            owner="Security Team", related_vulnerabilities=[], residual_risk="Medium"
        )
        self.sc_encryption = SecurityControl(
            name="Data Encryption", description="Encrypt data at rest and transit", mitigates=[self.av_data_breach],
            cost_to_implement="High", effectiveness="High", implementation_status="Implemented",
            owner="Infra Team", related_vulnerabilities=["UserDB Data Breach"], residual_risk="Low"
        )

        self.available_controls: List[SecurityControl] = [
            self.sc_input_validation, self.sc_patching, self.sc_firewall, self.sc_encryption
        ]

        # For YAML tests
        self.temp_yaml_file = "temp_test_threat_model.yaml"


    def tearDown(self):
        if os.path.exists(self.temp_yaml_file):
            os.remove(self.temp_yaml_file)

    def _create_temp_yaml_file(self, content: dict):
        with open(self.temp_yaml_file, 'w') as f:
            yaml.dump(content, f)

    def test_identify_attack_surfaces(self): # Largely the same, but setup provides richer vulns
        surfaces = identify_attack_surfaces(self.application, self.known_vulnerabilities)
        self.assertEqual(len(surfaces), 4)

        ws_surface = next((s for s in surfaces if s.component_name == "WebService"), None)
        self.assertIsNotNone(ws_surface)
        self.assertIn(self.vuln_generic_unpatched, ws_surface.potential_vulnerabilities)
        self.assertIn(self.vuln_webservice_xss, ws_surface.potential_vulnerabilities)
        self.assertIn(self.vuln_service_public_exploit, ws_surface.potential_vulnerabilities) # Matched by target_components in AV

    def test_suggest_security_controls_new_reason_format_and_logic(self):
        # Simplified surfaces for direct testing of suggestion logic
        ws_surface = IdentifiedAttackSurface(component_name="WebService", component_type="Service", network_zone="public", reason="Public")
        # vuln_webservice_xss is specifically listed in sc_input_validation.related_vulnerabilities
        # vuln_service_public_exploit is NOT specifically listed but its AV (av_public_exploit) is mitigated by sc_firewall
        ws_surface.potential_vulnerabilities = [self.vuln_webservice_xss, self.vuln_service_public_exploit, self.vuln_generic_unpatched]

        test_surfaces = [ws_surface]
        suggestions = suggest_security_controls(test_surfaces, self.available_controls)

        self.assertEqual(len(suggestions), 3) # Expect Input Validation, Firewall, Patching

        iv_suggestion = next((s for s in suggestions if s.control.name == "Input Validation"), None)
        self.assertIsNotNone(iv_suggestion)
        self.assertIn("Mitigates specific vulnerability 'WebService XSS'", iv_suggestion.reason_for_suggestion)
        self.assertIn(f"CVE: {self.vuln_webservice_xss.cve_id}", iv_suggestion.reason_for_suggestion)
        self.assertIn(f"CVSS: {self.vuln_webservice_xss.cvss_score}", iv_suggestion.reason_for_suggestion)
        self.assertIn(f"Control Status: {self.sc_input_validation.implementation_status}", iv_suggestion.reason_for_suggestion)
        self.assertIn(f"Owner: {self.sc_input_validation.owner}", iv_suggestion.reason_for_suggestion)
        self.assertIn(f"Residual Risk: {self.sc_input_validation.residual_risk}", iv_suggestion.reason_for_suggestion)

        firewall_suggestion = next((s for s in suggestions if s.control.name == "Firewall"), None)
        self.assertIsNotNone(firewall_suggestion)
        self.assertIn(f"Mitigates general attack vector '{self.av_public_exploit.name}'", firewall_suggestion.reason_for_suggestion)
        self.assertIn(f"relevant to vulnerability '{self.vuln_service_public_exploit.name}'", firewall_suggestion.reason_for_suggestion)
        self.assertIn(f"CVE: {self.vuln_service_public_exploit.cve_id}", firewall_suggestion.reason_for_suggestion) # Check CVE from vuln
        self.assertIn(f"Control Status: {self.sc_firewall.implementation_status}", firewall_suggestion.reason_for_suggestion)

        patching_suggestion = next((s for s in suggestions if s.control.name == "Regular Patching"), None)
        self.assertIsNotNone(patching_suggestion)
        self.assertIn(f"Mitigates general attack vector '{self.av_unpatched.name}'", patching_suggestion.reason_for_suggestion)
        self.assertIn(f"relevant to vulnerability '{self.vuln_generic_unpatched.name}'", patching_suggestion.reason_for_suggestion)
        self.assertIn(f"CVSS: {self.vuln_generic_unpatched.cvss_score}", patching_suggestion.reason_for_suggestion) # Check CVSS from vuln
        self.assertIn(f"Control Status: {self.sc_patching.implementation_status}", patching_suggestion.reason_for_suggestion)

    # --- Tests for load_threat_intelligence_from_yaml ---

    def test_load_threat_intelligence_successful(self):
        yaml_content = {
            "threat_actors": [{
                "name": "TA1", "skill_level": "High", "motivation": "Financial",
                "resources": "Advanced", "likely_targets": ["Databases"], "attack_history": ["SQLi"]
            }],
            "attack_vectors": [{
                "name": "AV1", "description": "Desc1", "target_components": ["DB"],
                "ease_of_exploitation": "Easy", "required_privileges": "User",
                "mitigation_complexity": "Low", "cwe_id": "CWE-89"
            }],
            "vulnerabilities": [{
                "name": "Vuln1", "description": "DescVuln1", "attack_vector": "AV1",
                "affected_components": ["Comp1"], "severity": "Critical",
                "exploitability": "Easy", "impact_description": "Full control",
                "cve_id": "CVE-2024-0001", "cvss_score": 9.8
            }],
            "security_controls": [{
                "name": "SC1", "description": "DescSC1", "mitigates": ["AV1"],
                "cost_to_implement": "Low", "effectiveness": "High",
                "implementation_status": "Implemented", "owner": "Team A",
                "related_vulnerabilities": ["Vuln1"], "residual_risk": "Low"
            }]
        }
        self._create_temp_yaml_file(yaml_content)
        actors, vectors, vulns, controls = load_threat_intelligence_from_yaml(self.temp_yaml_file)

        self.assertEqual(len(actors), 1)
        self.assertEqual(len(vectors), 1)
        self.assertEqual(len(vulns), 1)
        self.assertEqual(len(controls), 1)

        # Test ThreatActor
        self.assertEqual(actors[0].name, "TA1")
        self.assertEqual(actors[0].resources, "Advanced")
        self.assertEqual(actors[0].attack_history, ["SQLi"])

        # Test AttackVector
        self.assertEqual(vectors[0].name, "AV1")
        self.assertEqual(vectors[0].cwe_id, "CWE-89")

        # Test Vulnerability (and linking)
        self.assertEqual(vulns[0].name, "Vuln1")
        self.assertEqual(vulns[0].cve_id, "CVE-2024-0001")
        self.assertEqual(vulns[0].cvss_score, 9.8)
        self.assertIsInstance(vulns[0].attack_vector, AttackVector)
        self.assertEqual(vulns[0].attack_vector.name, "AV1")

        # Test SecurityControl (and linking)
        self.assertEqual(controls[0].name, "SC1")
        self.assertEqual(controls[0].implementation_status, "Implemented")
        self.assertEqual(controls[0].related_vulnerabilities, ["Vuln1"])
        self.assertIsInstance(controls[0].mitigates[0], AttackVector)
        self.assertEqual(controls[0].mitigates[0].name, "AV1")

    def test_load_threat_intelligence_file_not_found(self):
        with self.assertRaises(FileNotFoundError):
            load_threat_intelligence_from_yaml("non_existent_tm_file.yaml")

    def test_load_threat_intelligence_malformed_yaml(self):
        malformed_content = "threat_actors: [name: TA1, skill_level: High]" # Missing closing } and proper list item start
        with open(self.temp_yaml_file, 'w') as f:
            f.write(malformed_content)
        with self.assertRaises(yaml.YAMLError):
            load_threat_intelligence_from_yaml(self.temp_yaml_file)

    def test_load_threat_intelligence_missing_required_field(self):
        # Missing 'skill_level' for threat_actor
        invalid_content = {"threat_actors": [{"name": "TA1", "motivation": "Test"}]}
        self._create_temp_yaml_file(invalid_content)
        with self.assertRaisesRegex(ValueError, "Missing required key 'skill_level' in a threat_actor entry"):
            load_threat_intelligence_from_yaml(self.temp_yaml_file)

    def test_load_threat_intelligence_incorrect_data_type(self):
        # 'cvss_score' should be float, providing string
        invalid_content = {
            "attack_vectors": [], # Need this for vuln parsing
            "vulnerabilities": [{
                "name": "Vuln1", "description": "Desc", "attack_vector": "AV1_dummy",
                "affected_components": [], "severity": "Low", "exploitability": "Easy",
                "impact_description": "...", "cvss_score": "high"
            }]
        }
        # Dummy AV for the vuln to try and parse
        dummy_av_content = {"attack_vectors": [{"name": "AV1_dummy", "description": "d", "target_components": [], "ease_of_exploitation":"e", "required_privileges":"r", "mitigation_complexity":"m"}]}
        full_invalid_content = {**dummy_av_content, **invalid_content} # merge them
        self._create_temp_yaml_file(full_invalid_content)

        with self.assertRaisesRegex(ValueError, "could not convert string to float: 'high'"): # Error from float()
             load_threat_intelligence_from_yaml(self.temp_yaml_file)


    def test_load_threat_intelligence_unresolved_link(self):
        # Vulnerability refers to "NonExistentAV"
        invalid_content = {
            "attack_vectors": [{"name": "AV1", "description": "d", "target_components": [], "ease_of_exploitation":"e", "required_privileges":"r", "mitigation_complexity":"m"}],
            "vulnerabilities": [{
                "name": "Vuln1", "description": "Desc", "attack_vector": "NonExistentAV",
                "affected_components": [], "severity": "Low", "exploitability": "Easy", "impact_description": "..."
            }]
        }
        self._create_temp_yaml_file(invalid_content)
        with self.assertRaisesRegex(ValueError, "Attack vector 'NonExistentAV' not found for vulnerability 'Vuln1'"):
            load_threat_intelligence_from_yaml(self.temp_yaml_file)

    def test_load_empty_sections_gracefully(self):
        yaml_content = {
            "threat_actors": [],
            "attack_vectors": [],
            "vulnerabilities": [],
            "security_controls": []
        }
        self._create_temp_yaml_file(yaml_content)
        actors, vectors, vulns, controls = load_threat_intelligence_from_yaml(self.temp_yaml_file)
        self.assertEqual(len(actors), 0)
        self.assertEqual(len(vectors), 0)
        self.assertEqual(len(vulns), 0)
        self.assertEqual(len(controls), 0)

    def test_load_missing_top_level_key_gracefully(self):
        yaml_content = { # Missing "threat_actors"
            "attack_vectors": [],
            "vulnerabilities": [],
            "security_controls": []
        }
        self._create_temp_yaml_file(yaml_content)
        actors, vectors, vulns, controls = load_threat_intelligence_from_yaml(self.temp_yaml_file)
        self.assertEqual(len(actors), 0) # Should be empty
        self.assertEqual(len(vectors), 0)


if __name__ == '__main__':
    unittest.main()
