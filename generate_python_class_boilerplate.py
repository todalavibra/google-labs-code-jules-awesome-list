import collections

def generate_python_class_boilerplate(class_name, init_params=None, methods=None):
    """
    Generates boilerplate code for a Python class with optional type hints.

    Args:
        class_name (str): The name of the class.
        init_params (list of dict, optional): List of dicts for __init__ params.
                                             Each dict: {'name': str, 'type': str (optional)}.
                                             e.g., [{"name": "make", "type": "str"}].
        methods (list of dict, optional): List of dicts for methods.
                                         Each dict: {'name': str,
                                                    'params': list of dict (like init_params),
                                                    'return_type': str (optional)}.
                                         e.g., [{"name": "get_age", "params": [], "return_type": "int"}].
    Returns:
        str: The generated Python class code.
    """
    code_lines = []
    imports = set()

    # Class definition
    code_lines.append(f"class {class_name}:")
    code_lines.append(f"    \"\"\"")
    code_lines.append(f"    A class representing a {class_name}.")
    code_lines.append(f"    \"\"\"")

    # __init__ method
    actual_init_params = init_params if init_params is not None else []

    param_defs_init = []
    for param in actual_init_params:
        param_name = param['name']
        param_type = param.get('type')
        if param_type:
            param_defs_init.append(f"{param_name}: {param_type}")
            if any(c in param_type for c in "[]"): # Basic check for generic types
                imports.add("from typing import List, Dict, Tuple, Set, Any, Optional, Union")
        else:
            param_defs_init.append(param_name)

    init_params_str = ", ".join(param_defs_init)

    code_lines.append(f"")
    if actual_init_params:
        code_lines.append(f"    def __init__(self, {init_params_str}):")
    else:
        code_lines.append(f"    def __init__(self):")

    code_lines.append(f"        \"\"\"")
    code_lines.append(f"        Initializes a new {class_name} instance.")
    code_lines.append(f"        \"\"\"")
    if actual_init_params:
        for param in actual_init_params:
            code_lines.append(f"        self.{param['name']} = {param['name']}")
    else:
        code_lines.append(f"        pass")

    # Other methods
    if methods:
        for method in methods:
            method_name = method.get("name", "new_method")
            method_params_list = method.get("params", [])
            return_type = method.get("return_type")

            param_defs_method = []
            for param_data in method_params_list:
                param_name = param_data['name']
                param_type = param_data.get('type')
                if param_type:
                    param_defs_method.append(f"{param_name}: {param_type}")
                    if any(c in param_type for c in "[]"):
                         imports.add("from typing import List, Dict, Tuple, Set, Any, Optional, Union")
                else:
                    param_defs_method.append(param_name)

            params_str = ", ".join(param_defs_method)

            method_signature = f"    def {method_name}(self"
            if params_str:
                method_signature += f", {params_str}"
            method_signature += ")"

            if return_type:
                method_signature += f" -> {return_type}:"
                if any(c in return_type for c in "[]"):
                    imports.add("from typing import List, Dict, Tuple, Set, Any, Optional, Union")
            else:
                method_signature += ":"

            code_lines.append(f"")
            code_lines.append(method_signature)
            code_lines.append(f"        \"\"\"")
            code_lines.append(f"        Docstring for {method_name} method.")
            code_lines.append(f"        \"\"\"")
            code_lines.append(f"        pass")

    # Add imports at the beginning if any
    final_code = ""
    if imports:
        final_code += "\n".join(sorted(list(imports))) + "\n\n" # Corrected newline for subtask
    final_code += "\n".join(code_lines) # Corrected newline for subtask

    return final_code

# --- Example Usage (Updated) ---
print("--- Example 1: Basic Car Class with Type Hints ---")
car_class_code_typed = generate_python_class_boilerplate(
    class_name="Car",
    init_params=[
        {"name": "make", "type": "str"},
        {"name": "model", "type": "str"},
        {"name": "year", "type": "int"},
        {"name": "features", "type": "List[str]"}
    ],
    methods=[
        {"name": "start_engine", "params": [], "return_type": "bool"},
        {"name": "drive", "params": [{"name": "speed", "type": "int"}], "return_type": "None"},
        {"name": "get_details", "params": [], "return_type": "Dict[str, Any]"}
    ]
)
print(car_class_code_typed)
print("\n" + "="*50 + "\n")

print("--- Example 2: Simple Logger Class with Type Hints ---")
logger_class_code_typed = generate_python_class_boilerplate(
    class_name="Logger",
    init_params = [{"name": "log_file", "type": "str"}],
    methods=[
        {"name": "log_message",
         "params": [{"name": "message", "type": "str"}, {"name": "level", "type": "str"}],
         "return_type": "None"}
    ]
)
print(logger_class_code_typed)
print("\n" + "="*50 + "\n")

print("--- Example 3: Empty Class (should have default __init__) ---")
empty_class_code_typed = generate_python_class_boilerplate(class_name="MyEmptyClassTyped")
print(empty_class_code_typed)
print("\n" + "="*50 + "\n")

print("--- Example 4: Class with only init types ---")
config_class_code = generate_python_class_boilerplate(
    class_name="AppConfig",
    init_params=[
        {"name": "setting1", "type": "str"},
        {"name": "setting2", "type": "int"}
    ]
)
print(config_class_code)
print("\n" + "="*50 + "\n")

print("--- Example 5: Class with only method types ---")
util_class_code = generate_python_class_boilerplate(
    class_name="StringUtil",
    methods=[
        {"name": "reverse_string", "params": [{"name": "s", "type": "str"}], "return_type": "str"},
        {"name": "count_chars", "params": [{"name": "s", "type": "str"}], "return_type": "int"}
    ]
)
print(util_class_code)
print("\n" + "="*50 + "\n")

print("--- Example 6: Class with Union and Optional types ---")
user_profile_code = generate_python_class_boilerplate(
    class_name="UserProfile",
    init_params=[
        {"name": "user_id", "type": "int"},
        {"name": "username", "type": "str"},
        {"name": "email", "type": "Optional[str]"},
    ],
    methods=[
        {"name": "get_contact", "params": [], "return_type": "Union[str, None]"},
        {"name": "set_preference", "params": [{"name": "key", "type": "str"}, {"name": "value", "type": "Any"}], "return_type": "None"}
    ]
)
print(user_profile_code)
print("\n" + "="*50 + "\n")
