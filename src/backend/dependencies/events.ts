import EventEmitter from 'node:events';
import { DependencyName, EventKind, DependencyEvent, ProcessStatusEvent, ProcessStatus } from '../../shared';

export const emitter = new EventEmitter();

/**
 * @TODO - consider moving event namespaces into constants here, or into ../../shared.ts
 */

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

export const emitStatusChange = (name: DependencyName, status: ProcessStatus) => {
  const event: ProcessStatusEvent = {
    name,
    kind: EventKind.StatusChange,
    status,
  };
  emitter.emit('process-status', event);
};