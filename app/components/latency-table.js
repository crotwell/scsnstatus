import Component from '@glimmer/component';
import { action } from "@ember/object";
import { inject as service } from '@ember/service';

export default class LatencyTableComponent extends Component {
  @service dataLatency;
}
