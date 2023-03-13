import {DataSOHType} from './jsonl_loader';

export function scatterplot<Type extends DataSOHType>(selector: string,
                            data: Array<Type>,
                            keyFn: ((d:Type)=> string)|((d:Type)=> number),
                            allStations: Array<string>,
                            lineColors: Array<string>
                          ): void;
