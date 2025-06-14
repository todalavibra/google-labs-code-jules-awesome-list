import unittest
from typing import List
from architecture import Application, Service, Database, NetworkZone
from threat_model import (
    ThreatActor, AttackVector, Vulnerability, SecurityControl,
    IdentifiedAttackSurface, SuggestedControl,
    identify_attack_surfaces, suggest_security_controls
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

        # 2. Threat Modeling Components
        # Attack Vectors
        self.av_sqli = AttackVector(name="SQL Injection", description="...", target_components=["Database", "Service"])
        self.av_xss = AttackVector(name="Cross-Site Scripting", description="...", target_components=["Service"])
        self.av_public_exploit = AttackVector(name="Public Exploit", description="Exploiting public services", target_components=["Service"])
        self.av_data_breach = AttackVector(name="Data Breach", description="Stealing sensitive data", target_components=["Database", "Service"])
        self.av_unpatched = AttackVector(name="Unpatched Software", description="...", target_components=["Service", "Database"])


        # Vulnerabilities
        self.vuln_generic_unpatched = Vulnerability(name="CVE-GENERIC-UNPATCHED", description="Generic unpatched library", attack_vector=self.av_unpatched, affected_components=[], severity="Medium")
        self.vuln_appservice_sqli = Vulnerability(name="CVE-APPSERV-SQLI", description="SQLi in AppService", attack_vector=self.av_sqli, affected_components=["AppService"], severity="High")
        self.vuln_webservice_xss = Vulnerability(name="CVE-WEBSERV-XSS", description="XSS in WebService", attack_vector=self.av_xss, affected_components=["WebService"], severity="Low")
        self.vuln_userdb_breach = Vulnerability(name="CVE-USERDB-BREACH", description="UserDB data breach vector", attack_vector=self.av_data_breach, affected_components=["UserDB"], severity="Critical")
        self.vuln_service_public = Vulnerability(name="CVE-SERVICE-PUBLIC", description="Generic public service exploit", attack_vector=self.av_public_exploit, target_components=["Service"], severity="Medium", affected_components=[])


        self.known_vulnerabilities: List[Vulnerability] = [
            self.vuln_generic_unpatched, self.vuln_appservice_sqli, self.vuln_webservice_xss, self.vuln_userdb_breach, self.vuln_service_public
        ]

        # Security Controls
        self.sc_input_validation = SecurityControl(name="Input Validation", description="...", mitigates=[self.av_sqli, self.av_xss], cost_to_implement="Medium", effectiveness="High")
        self.sc_patching = SecurityControl(name="Regular Patching", description="...", mitigates=[self.av_unpatched], cost_to_implement="Medium", effectiveness="High")
        self.sc_firewall = SecurityControl(name="Firewall", description="...", mitigates=[self.av_public_exploit], cost_to_implement="Low", effectiveness="Medium")
        self.sc_encryption = SecurityControl(name="Data Encryption", description="...", mitigates=[self.av_data_breach], cost_to_implement="High", effectiveness="High")

        self.available_controls: List[SecurityControl] = [
            self.sc_input_validation, self.sc_patching, self.sc_firewall, self.sc_encryption
        ]

    def test_identify_attack_surfaces(self):
        surfaces = identify_attack_surfaces(self.application, self.known_vulnerabilities)

        self.assertEqual(len(surfaces), 4) # WebService (public), AppService (sensitive), PublicSensitiveService (public; sensitive), UserDB (sensitive)

        ws_surface = next((s for s in surfaces if s.component_name == "WebService"), None)
        self.assertIsNotNone(ws_surface)
        self.assertEqual(ws_surface.component_type, "Service")
        self.assertEqual(ws_surface.network_zone, "public")
        self.assertEqual(ws_surface.reason, "Publicly exposed service")
        # Vulnerabilities for WebService: CVE-GENERIC-UNPATCHED (general), CVE-WEBSERV-XSS (name), CVE-SERVICE-PUBLIC (type Service)
        self.assertIn(self.vuln_generic_unpatched, ws_surface.potential_vulnerabilities)
        self.assertIn(self.vuln_webservice_xss, ws_surface.potential_vulnerabilities)
        self.assertIn(self.vuln_service_public, ws_surface.potential_vulnerabilities)
        self.assertNotIn(self.vuln_appservice_sqli, ws_surface.potential_vulnerabilities)


        as_surface = next((s for s in surfaces if s.component_name == "AppService"), None)
        self.assertIsNotNone(as_surface)
        self.assertEqual(as_surface.reason, "Handles sensitive data")
        # Vulnerabilities for AppService: CVE-GENERIC-UNPATCHED (general), CVE-APPSERV-SQLI (name)
        self.assertIn(self.vuln_generic_unpatched, as_surface.potential_vulnerabilities)
        self.assertIn(self.vuln_appservice_sqli, as_surface.potential_vulnerabilities)
        self.assertNotIn(self.vuln_webservice_xss, as_surface.potential_vulnerabilities)


        pss_surface = next((s for s in surfaces if s.component_name == "PublicSensitiveService"), None)
        self.assertIsNotNone(pss_surface)
        self.assertIn("Publicly exposed service", pss_surface.reason)
        self.assertIn("Handles sensitive data", pss_surface.reason)
         # Vulnerabilities for PublicSensitiveService: CVE-GENERIC-UNPATCHED (general), CVE-SERVICE-PUBLIC (type Service)
        self.assertIn(self.vuln_generic_unpatched, pss_surface.potential_vulnerabilities)
        self.assertIn(self.vuln_service_public, pss_surface.potential_vulnerabilities)

        udb_surface = next((s for s in surfaces if s.component_name == "UserDB"), None)
        self.assertIsNotNone(udb_surface)
        self.assertEqual(udb_surface.reason, "Stores sensitive data")
        # Vulnerabilities for UserDB: CVE-GENERIC-UNPATCHED (general), CVE-USERDB-BREACH (name)
        self.assertIn(self.vuln_generic_unpatched, udb_surface.potential_vulnerabilities)
        self.assertIn(self.vuln_userdb_breach, udb_surface.potential_vulnerabilities)


    def test_suggest_security_controls(self):
        # Use a subset of surfaces for more focused testing, or create new ones
        # For this test, let's assume WebService surface has its vulnerabilities identified
        ws_surface = IdentifiedAttackSurface(component_name="WebService", component_type="Service", network_zone="public", reason="Publicly exposed service")
        ws_surface.potential_vulnerabilities = [self.vuln_generic_unpatched, self.vuln_webservice_xss, self.vuln_service_public]

        # AppService surface with its vulnerabilities
        as_surface = IdentifiedAttackSurface(component_name="AppService", component_type="Service", network_zone="private", reason="Handles sensitive data")
        as_surface.potential_vulnerabilities = [self.vuln_generic_unpatched, self.vuln_appservice_sqli]

        test_surfaces = [ws_surface, as_surface]

        suggestions = suggest_security_controls(test_surfaces, self.available_controls)

        # Expected suggestions:
        # For WebService (vuln_generic_unpatched -> av_unpatched -> sc_patching)
        # For WebService (vuln_webservice_xss -> av_xss -> sc_input_validation)
        # For WebService (vuln_service_public -> av_public_exploit -> sc_firewall)
        # For AppService (vuln_generic_unpatched -> av_unpatched -> sc_patching) - already suggested for this control if we consider all surfaces at once
        # For AppService (vuln_appservice_sqli -> av_sqli -> sc_input_validation)

        ws_suggestions = [s for s in suggestions if s.applies_to_surface.component_name == "WebService"]
        as_suggestions = [s for s in suggestions if s.applies_to_surface.component_name == "AppService"]

        self.assertEqual(len(ws_suggestions), 3)
        self.assertTrue(any(s.control == self.sc_patching for s in ws_suggestions))
        self.assertTrue(any(s.control == self.sc_input_validation for s in ws_suggestions))
        self.assertTrue(any(s.control == self.sc_firewall for s in ws_suggestions))

        self.assertEqual(len(as_suggestions), 2)
        self.assertTrue(any(s.control == self.sc_patching for s in as_suggestions))
        self.assertTrue(any(s.control == self.sc_input_validation for s in as_suggestions))

        # Test that Input Validation for AppService (due to SQLi) has the correct reason
        app_service_sqli_suggestion = next(s for s in as_suggestions if s.control == self.sc_input_validation)
        self.assertIn(self.av_sqli.name, app_service_sqli_suggestion.reason_for_suggestion)
        self.assertIn(self.vuln_appservice_sqli.name, app_service_sqli_suggestion.reason_for_suggestion)
        self.assertEqual(app_service_sqli_suggestion.applies_to_surface, as_surface)

        # Test for non-duplication: sc_patching should be suggested for WebService (due to vuln_generic_unpatched)
        # and also for AppService (due to vuln_generic_unpatched). These are distinct suggestions as they apply to different surfaces.
        # The non-duplication rule is per surface, per control.
        patching_suggestions = [s for s in suggestions if s.control == self.sc_patching]
        self.assertEqual(len(patching_suggestions), 2) # One for WebService, one for AppService

        # Test that if a control mitigates multiple vulnerabilities on THE SAME surface, it's only listed once for that surface.
        # Add another XSS vuln to WebService that sc_input_validation also mitigates
        another_xss_vuln = Vulnerability(name="CVE-WEBSERV-XSS-2", description="Another XSS", attack_vector=self.av_xss, affected_components=["WebService"], severity="Medium")
        ws_surface_with_multiple_match_for_control = IdentifiedAttackSurface(component_name="WebService", component_type="Service", network_zone="public", reason="Publicly exposed service")
        ws_surface_with_multiple_match_for_control.potential_vulnerabilities = [self.vuln_webservice_xss, another_xss_vuln] # Both mitigated by sc_input_validation

        suggestions_single_surface_multiple_vulns = suggest_security_controls([ws_surface_with_multiple_match_for_control], [self.sc_input_validation])
        self.assertEqual(len(suggestions_single_surface_multiple_vulns), 1)
        self.assertEqual(suggestions_single_surface_multiple_vulns[0].control, self.sc_input_validation)
        # Ensure the reason is from the first one matched (vuln_webservice_xss)
        self.assertIn(self.vuln_webservice_xss.name, suggestions_single_surface_multiple_vulns[0].reason_for_suggestion)


if __name__ == '__main__':
    unittest.main()
