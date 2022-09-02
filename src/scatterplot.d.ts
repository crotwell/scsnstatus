import * as sp from 'seisplotjs';
import {DataSOHType} from './jsonl_loader';
const d3 = sp.d3;

export function scatterplot<Type extends DataSOHType>(selector: string,
                            data: Array<Type>,
                            keyFn: ((d:Type)=> string)|((d:Type)=> number),
                            allStations: Array<string>,
                            lineColors: Array<string>
                          ): void;
