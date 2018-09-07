import DS from 'ember-data';
import moment from 'moment';

export default DS.JSONAPISerializer.extend({

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    if (requestType === 'findRecord') {
      return this.normalize(primaryModelClass, payload);
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
    // eeyore uses day of year with leading 0, trim it
    let dofy = resourceHash.dayofyear.match(/0*(\d+)/);
    if (! dofy) {
      throw new Error("regex for day of year did not match: "+resourceHash.dayofyear);
    }
    const idStr = resourceHash.station+"_"+resourceHash.year+"_"+dofy[1];
    for (const v of resourceHash.values) {
      v.volt = Number.parseFloat(v.volt);
      v.netrssi = Number.parseFloat(v.netrssi);
      if (v.latency) {
        v.latency.eeyore = Number.parseFloat(v.latency.eeyore);
        if (v.latency.eeyore > 1500000000) {delete v.latency.eeyore; }
        v.latency.thecloud = Number.parseFloat(v.latency.thecloud);
        if (v.latency.thecloud > 1500000000) {delete v.latency.thecloud; }
        v.latency.iris = Number.parseFloat(v.latency.iris);
        if (v.latency.iris > 1500000000) {delete v.latency.iris; }
      }
      v.time = moment(v.time);
    }
    const data = {
      id: idStr,
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
