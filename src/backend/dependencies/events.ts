import EventEmitter from 'node:events';
import { DependencyName, EventKind, DependencyEvent } from '../../shared';

export const emitter = new EventEmitter();

export const emitInstallError = (name: DependencyName, msg: string) => {
  const event: DependencyEvent = {
    name,
    kind: EventKind.InstallError,
    msg
  };
  emitter.emit('error', event);
};

export const emitInstallProgress = (name: DependencyName, msg: string) => {
  const event: DependencyEvent = {
    name,
    kind: EventKind.InstallProgress,
    msg,
  };
  emitter.emit('progress', event);
};
