import DS from 'ember-data';

export default DS.Model.extend({
    label: DS.attr('string'),
    name: DS.attr('string'),
    options: DS.attr({ defaultValue: () => [] }),
    rarity: DS.attr('string'),
    description: DS.attr('string'),
    inputType: DS.attr('string'),
    valueType: DS.attr('string'),
    values: DS.attr(),
    attributes: DS.attr({ defaultValue: () => [] }),
    group: DS.attr('string'),
    resourceType: DS.attr('string')
});
