import json
import yaml

with open('/app/docs/folder_structure.json', 'r') as json_file:
    data = json.load(json_file)

with open('/app/docs/folder_structure.yml', 'w') as yaml_file:
    yaml.dump(data, yaml_file, sort_keys=False, default_flow_style=False)

print(/app/docs/folder_structure.yml が作成されました。")"変換)
