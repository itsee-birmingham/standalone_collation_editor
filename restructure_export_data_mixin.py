from .exceptions import MissingSuffixesException


class RestructureExportDataMixin(object):

    def clean_collation_unit(self, collation_unit):
        """Clean the data and back fill anything missing from older data structures.

        Args:
            collation_unit (dict): The collation unit structure which has two keys (context, structure) where structure
            is the JSON that comes out of the collation editor.

        Raises:
            MissingSuffixesException: raised if any of the readings in this collation unit are missing the list of
            witness suffixes.
        """
        structure = collation_unit['structure']
        # remove the data we don't need (without raising an error if it isn't there)
        structure.pop('special_categories', None)
        structure.pop('marked_readings', None)
        # simplify overtext structure
        to_remove = ['reading', 'siglum', 'rule_match', 'verse', 't']
        structure['overtext'] = [self._strip_keys(x, to_remove) for x in structure['overtext']['tokens']]

        # now do the variant units
        for key in structure:
            if 'apparatus' in key:
                for variant_unit in structure[key]:
                    try:
                        self._clean_variant_unit(variant_unit)
                    except MissingSuffixesException:
                        raise MissingSuffixesException(f'At least one of the readings in {collation_unit["context"]} '
                                                       f'is missing the suffixes data. Reapproving this unit will '
                                                       f'probably fix the problem.')

    def _clean_variant_unit(self, variant_unit):
        """Clean up the data in the variant unit which is modified in place.

        Args:
            variant_unit (dict): The JSON dictionary representing the variant unit.

        Raises:
            MissingSuffixesException: raised if any of the readings in this variant unit are missing the list of
            witness suffixes.
        """
        # remove what we don't need (without raising an error if it isn't there)
        variant_unit.pop('first_word_index', None)
        variant_unit.pop('_id', None)
        variant_unit.pop('overlap_units', None)
        for reading in variant_unit['readings']:
            try:
                self._clean_reading(reading)
            except MissingSuffixesException:
                raise

    def _clean_reading(self, reading):
        """Clean up the reading data including backfilling any details that might be missing in older data.

        Args:
            reading (dict): The JSON dictionary representing the reading.

        Raises:
            MissingSuffixesException: raised if the reading is missing the list of witness suffixes.
        """
        # first check that we don't have any unfixable missing data because if we do we may as well stop now
        if len(reading['witnesses']) > 0 and 'suffixes' not in reading:
            raise MissingSuffixesException()

        self._supply_missing_reading_data(reading)
        # remove the stuff we don't need
        reading.pop('SR_text', None)
        reading.pop('standoff_subreadings', None)
        # restructure the text array to make it as minimal as it possibly can be
        reading['text'] = self._simplify_text_list(reading)
        if 'subreadings' in reading:
            for type in reading['subreadings']:
                for subreading in reading['subreadings'][type]:
                    self._clean_reading(subreading)
        # promote all subreadings?

    def _supply_missing_reading_data(self, reading):
        """Supply keys which may be missing in older versions of the data.

        Args:
            reading (dict): The JSON dictionary representing the reading which is modified in place.
        """
        # now backfill any missing data in the older structures
        # make the text_string if it doesn't exist
        if 'text_string' not in reading:
            reading['text_string'] = ' '.join([i['interface'] for i in reading['text']])
        # make the label_suffix and the reading_suffix values if we need them and they don't exist
        if 'reading_classes' in reading and len(reading['reading_classes']) > 0:
            if 'label_suffix' not in reading:
                label_suffixes = []
                for clss in reading['reading_classes']:
                    for rule in self.rule_classes:
                        if rule['value'] == clss:
                            if rule['suffixed_label'] is True:
                                label_suffixes.append(rule['identifier'])
                if len(label_suffixes) > 0:
                    label_suffixes.sort()
                reading['label_suffix'] = ''.join(label_suffixes)
            if 'reading_suffix' not in reading:
                reading_suffixes = []
                for clss in reading['reading_classes']:
                    for rule in self.rule_classes:
                        if rule['value'] == clss:
                            if rule['suffixed_reading'] is True:
                                reading_suffixes.append(rule['identifier'])
                if len(reading_suffixes) > 0:
                    reading['reading_suffix'] = ''.join(reading_suffixes)

    def _simplify_text_list(self, reading):
        """
        Args:
            reading (dict): The JSON dictionary representing the reading.

        Returns:
            list: The simplified text list.
        """
        to_remove = ['index', 'reading', 'verse']
        for wit in reading['witnesses']:
            to_remove.append(wit)
        return [self._strip_keys(x, to_remove) for x in reading['text']]

    def _strip_keys(self, data_dict, to_remove):
        """Strip the specified keys from the dictionary without raising an exception if they are not present.

        Args:
            data_dict (dict): The dictionary to be modified.
            to_remove (list): The list of keys to be removed from the dictionary.

        Returns:
            dict: The input dictionary with the keys in the to_remove list removed.
        """
        for item in to_remove:
            data_dict.pop(item, None)
        return data_dict
