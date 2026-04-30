export interface ICommonEvents {
    event: CommonTypeEvent;
    target: any;
    value: any;
}

export enum CommonTypeEvent {
    click = 'click',
    focus = 'focus',
    blur = 'blur',
    init = 'init',
    change = 'change',
    destroy = 'destroy',
}

export enum CommonValueEvent {
    closed = 'fechado',
    initiated = 'iniciado',
    destroyed = 'destruido',
    continue = 'continuar',
    back = 'voltar',
}
