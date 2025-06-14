import unittest
import os
import yaml
from architecture import Application, Service, Database, NetworkZone, load_architecture_from_yaml

class TestArchitecture(unittest.TestCase):

    def setUp(self):
        self.test_yaml_file = "test_arch.yaml"
        self.valid_yaml_content = {
            "network_zones": [
                {"name": "public"},
                {"name": "private"}
            ],
            "services": [
                {
                    "name": "web_server", "port": 80, "protocol": "TCP",
                    "network_zone": "public", "processes_sensitive_data": False
                },
                {
                    "name": "app_server", "port": 8080, "protocol": "TCP",
                    "network_zone": "private", "processes_sensitive_data": True
                }
            ],
            "databases": [
                {
                    "name": "customer_db", "type": "SQL",
                    "network_zone": "private", "stores_sensitive_data": True
                }
            ]
        }
        with open(self.test_yaml_file, 'w') as f:
            yaml.dump(self.valid_yaml_content, f)

        self.malformed_yaml_content = "network_zones: [name: public" # Intentionally malformed
        self.malformed_yaml_file = "malformed_arch.yaml"
        with open(self.malformed_yaml_file, 'w') as f:
            f.write(self.malformed_yaml_content)

    def tearDown(self):
        if os.path.exists(self.test_yaml_file):
            os.remove(self.test_yaml_file)
        if os.path.exists(self.malformed_yaml_file):
            os.remove(self.malformed_yaml_file)

    def test_successful_load(self):
        application = load_architecture_from_yaml(self.test_yaml_file)
        self.assertIsInstance(application, Application)
        self.assertEqual(len(application.network_zones), 2)
        self.assertEqual(len(application.services), 2)
        self.assertEqual(len(application.databases), 1)

        public_zone = next(nz for nz in application.network_zones if nz.name == "public")
        private_zone = next(nz for nz in application.network_zones if nz.name == "private")
        self.assertIsNotNone(public_zone)
        self.assertIsNotNone(private_zone)

        web_server = next(s for s in application.services if s.name == "web_server")
        self.assertEqual(web_server.port, 80)
        self.assertEqual(web_server.protocol, "TCP")
        self.assertEqual(web_server.network_zone.name, "public")
        self.assertFalse(web_server.processes_sensitive_data)

        app_server = next(s for s in application.services if s.name == "app_server")
        self.assertEqual(app_server.port, 8080)
        self.assertEqual(app_server.network_zone.name, "private")
        self.assertTrue(app_server.processes_sensitive_data)

        customer_db = next(db for db in application.databases if db.name == "customer_db")
        self.assertEqual(customer_db.type, "SQL")
        self.assertEqual(customer_db.network_zone.name, "private")
        self.assertTrue(customer_db.stores_sensitive_data)

    def test_file_not_found(self):
        with self.assertRaises(FileNotFoundError):
            load_architecture_from_yaml("non_existent_file.yaml")

    def test_invalid_yaml(self):
        with self.assertRaises(yaml.YAMLError): # The function itself raises yaml.YAMLError
            load_architecture_from_yaml(self.malformed_yaml_file)

    def test_value_errors_in_yaml_structure(self):
        # Test missing 'name' in network_zone
        invalid_data = {"network_zones": [{"test": "public"}]}
        with open("invalid_struct.yaml", 'w') as f: yaml.dump(invalid_data, f)
        with self.assertRaisesRegex(ValueError, "Invalid format for network zone entry"):
            load_architecture_from_yaml("invalid_struct.yaml")
        os.remove("invalid_struct.yaml")

        # Test service port not an int
        invalid_data = {
            "network_zones":[{"name":"pub"}],
            "services": [{"name":"s1", "port":"80", "protocol":"TCP", "network_zone":"pub"}]
        }
        with open("invalid_struct.yaml", 'w') as f: yaml.dump(invalid_data, f)
        with self.assertRaisesRegex(ValueError, "Service port must be an integer"):
            load_architecture_from_yaml("invalid_struct.yaml")
        os.remove("invalid_struct.yaml")

        # Test database with missing type
        invalid_data = {
            "network_zones":[{"name":"priv"}],
            "databases": [{"name":"db1", "network_zone":"priv"}] # Missing 'type'
        }
        with open("invalid_struct.yaml", 'w') as f: yaml.dump(invalid_data, f)
        with self.assertRaisesRegex(ValueError, "Missing required key 'type' for a database entry"):
            load_architecture_from_yaml("invalid_struct.yaml")
        os.remove("invalid_struct.yaml")


    def test_network_zone_instantiation(self):
        nz = NetworkZone(name="test_zone")
        self.assertEqual(nz.name, "test_zone")

    def test_service_instantiation(self):
        nz = NetworkZone(name="test_zone")
        s = Service(name="test_service", port=1234, protocol="UDP",
                    processes_sensitive_data=True, network_zone=nz)
        self.assertEqual(s.name, "test_service")
        self.assertEqual(s.port, 1234)
        self.assertEqual(s.protocol, "UDP")
        self.assertTrue(s.processes_sensitive_data)
        self.assertEqual(s.network_zone, nz)

    def test_database_instantiation(self):
        nz = NetworkZone(name="test_zone")
        db = Database(name="test_db", type="NoSQL", stores_sensitive_data=False, network_zone=nz)
        self.assertEqual(db.name, "test_db")
        self.assertEqual(db.type, "NoSQL")
        self.assertFalse(db.stores_sensitive_data)
        self.assertEqual(db.network_zone, nz)

if __name__ == '__main__':
    unittest.main()
