import os
import codecs


class Store(object):

    def clean_resource_type(self, resource_type):
        resource_type = resource_type.replace('..', '').replace('~', '')
        while resource_type[0] == '/':
            resource_type = resource_type[1:]
        return resource_type

    def store_resource(self, data_root, resource_type, resource):
        resource_type = self.clean_resource_type(resource_type)
        path = os.path.join(data_root, resource_type)
        dir = os.path.dirname(path)
        # Create directory if it does not exist
        if not os.path.exists(dir):
            os.makedirs(dir)
        # Create blank file if it does not exist
        # WARNING: this will overwrite current contents without warning the user
        with codecs.open(path, "w", 'utf-8') as fp:
            fp.write(resource)

    def delete_resource(self, data_root, resource_type):
        resource_type = self.clean_resource_type(resource_type)
        path = os.path.join(data_root, resource_type)
        if os.path.exists(path):
            os.remove(path)

    def list_child_directories_and_files(self, path):
        children = os.listdir(path)
        result = []
        for child in children:
            if os.path.isfile(os.path.join(path, child)):
                size = os.path.getsize(os.path.join(path, child))
                result.append({"name": child, "type": "file", "size": size})
            elif os.path.isdir(os.path.join(path, child)):
                result.append({"name": child, "type": "dir"})
        return result
