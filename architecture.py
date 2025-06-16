from typing import Union, List
import yaml

class NetworkZone:
    def __init__(self, name: str):
        self.name: str = name

class Component:
    def __init__(self, network_zone: NetworkZone):
        self.network_zone: NetworkZone = network_zone

class Service(Component):
    def __init__(self, name: str, port: int, protocol: str, processes_sensitive_data: bool, network_zone: NetworkZone):
        super().__init__(network_zone)
        self.name: str = name
        self.port: int = port
        self.protocol: str = protocol
        self.processes_sensitive_data: bool = processes_sensitive_data

class Database(Component):
    def __init__(self, name: str, type: str, stores_sensitive_data: bool, network_zone: NetworkZone):
        super().__init__(network_zone)
        self.name: str = name
        self.type: str = type
        self.stores_sensitive_data: bool = stores_sensitive_data

class Application:
    def __init__(self, services: List[Service], databases: List[Database], network_zones: List[NetworkZone]):
        self.services: List[Service] = services
        self.databases: List[Database] = databases
        self.network_zones: List[NetworkZone] = network_zones

def load_architecture_from_yaml(file_path: str) -> Application:
    try:
        with open(file_path, 'r') as f:
            data = yaml.safe_load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"Error: Architecture file not found at {file_path}")
    except yaml.YAMLError as e:
        raise yaml.YAMLError(f"Error: Invalid YAML format in {file_path}: {e}")

    if not isinstance(data, dict):
        raise ValueError(f"Error: Root of YAML must be a dictionary in {file_path}")

    # Create NetworkZones
    network_zones_data = data.get('network_zones', [])
    if not isinstance(network_zones_data, list):
        raise ValueError(f"Error: 'network_zones' must be a list in {file_path}")

    network_zones_map = {}
    created_network_zones = []
    for nz_data in network_zones_data:
        if not isinstance(nz_data, dict) or 'name' not in nz_data:
            raise ValueError(f"Error: Invalid format for network zone entry in {file_path}: {nz_data}")
        name = nz_data['name']
        if not isinstance(name, str):
            raise ValueError(f"Error: Network zone name must be a string in {file_path}: {name}")
        network_zone = NetworkZone(name=name)
        network_zones_map[name] = network_zone
        created_network_zones.append(network_zone)

    # Create Services
    services_data = data.get('services', [])
    if not isinstance(services_data, list):
        raise ValueError(f"Error: 'services' must be a list in {file_path}")

    created_services = []
    for s_data in services_data:
        if not isinstance(s_data, dict):
            raise ValueError(f"Error: Invalid format for service entry in {file_path}: {s_data}")
        try:
            name = s_data['name']
            port = s_data['port']
            protocol = s_data['protocol']
            nz_name = s_data['network_zone']
            processes_sensitive_data = s_data.get('processes_sensitive_data', False) # Default to False

            if not all(isinstance(val, str) for val in [name, protocol, nz_name]):
                 raise ValueError(f"Error: Service name, protocol, and network_zone name must be strings for service '{name}'.")
            if not isinstance(port, int):
                raise ValueError(f"Error: Service port must be an integer for service '{name}'.")
            if not isinstance(processes_sensitive_data, bool):
                raise ValueError(f"Error: Service processes_sensitive_data must be a boolean for service '{name}'.")


            if nz_name not in network_zones_map:
                raise ValueError(f"Error: Network zone '{nz_name}' for service '{name}' not defined in 'network_zones'.")

            network_zone_obj = network_zones_map[nz_name]
            service = Service(
                name=name,
                port=port,
                protocol=protocol,
                network_zone=network_zone_obj,
                processes_sensitive_data=processes_sensitive_data
            )
            created_services.append(service)
        except KeyError as e:
            raise ValueError(f"Error: Missing required key {e} for a service entry in {file_path}: {s_data}")
        except ValueError as e: # Catch ValueErrors from type checks
            raise e


    # Create Databases
    databases_data = data.get('databases', [])
    if not isinstance(databases_data, list):
        raise ValueError(f"Error: 'databases' must be a list in {file_path}")

    created_databases = []
    for db_data in databases_data:
        if not isinstance(db_data, dict):
            raise ValueError(f"Error: Invalid format for database entry in {file_path}: {db_data}")
        try:
            name = db_data['name']
            db_type = db_data['type']
            nz_name = db_data['network_zone']
            stores_sensitive_data = db_data.get('stores_sensitive_data', False) # Default to False

            if not all(isinstance(val, str) for val in [name, db_type, nz_name]):
                 raise ValueError(f"Error: Database name, type, and network_zone name must be strings for database '{name}'.")
            if not isinstance(stores_sensitive_data, bool):
                raise ValueError(f"Error: Database stores_sensitive_data must be a boolean for database '{name}'.")

            if nz_name not in network_zones_map:
                raise ValueError(f"Error: Network zone '{nz_name}' for database '{name}' not defined in 'network_zones'.")

            network_zone_obj = network_zones_map[nz_name]
            database = Database(
                name=name,
                type=db_type,
                network_zone=network_zone_obj,
                stores_sensitive_data=stores_sensitive_data
            )
            created_databases.append(database)
        except KeyError as e:
            raise ValueError(f"Error: Missing required key {e} for a database entry in {file_path}: {db_data}")
        except ValueError as e: # Catch ValueErrors from type checks
            raise e

    return Application(services=created_services, databases=created_databases, network_zones=created_network_zones)
