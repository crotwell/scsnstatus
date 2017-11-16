import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    if (requestType === 'findRecord') {
      return this.normalize(primaryModelClass, payload);
    } else if (requestType === 'findHasMany') {
    } else {
      console.log("normalizeResponse "+requestType+" payload len: "+payload.length);
      const mythis = this;
      return payload.reduce(function(documentHash, item) {
        let { data, included } = mythis.normalize(primaryModelClass, item);
        documentHash.included.push(...included);
        documentHash.data.push(data);
        return documentHash;
      }, { data: [], included: [] });
    }
  },
  normalize(modelClass, resourceHash) {
    if (modelClass.modelName === "cellstatus") {
      return this.normalizeCellStatus(resourceHash);
    }
  },
  normalizeCellStatus(resourceHash) {
    console.log("normalizeCellStatus: "+resourceHash.station+"_"+resourceHash.year+"_"+resourceHash.dayofyear);
    const data = {
      id: resourceHash.station+"_"+resourceHash.year+"_"+resourceHash.dayofyear,
      type: 'cellstatus',
      attributes: {
          station: resourceHash.station,
          year: resourceHash.year,
          dayOfYear: resourceHash.dayofyear,
          values: resourceHash.values
      }
    };
    const included = [];
    return { data: data, included: included };
  },
  serialize(snapshot, options) {
    var json = {
      id: snapshot.id
    };

    snapshot.eachAttribute((key, attribute) => {
      json[key] = snapshot.attr(key);
    });

    snapshot.eachRelationship((key, relationship) => {
      if (relationship.kind === 'belongsTo') {
        json[key] = snapshot.belongsTo(key, { id: true });
      } else if (relationship.kind === 'hasMany') {
        json[key] = snapshot.hasMany(key, { ids: true });
      }
    });

    return json;
  },
});
