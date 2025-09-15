import os
import pathlib
import json


def load_json_test_data(filename):

    file = os.path.join(pathlib.Path().resolve(), 'collation', 'core', filename)

    with open(file) as f:
        test_data = json.load(f)
    return test_data
