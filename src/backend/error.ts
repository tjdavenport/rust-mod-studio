enum DependencyErrors {
  InstallError = 'InstallError',
};

class DependencyError extends Error {
  constructor(message: string, name: DependencyErrors) {
    super(message);
    this.name = name;
  }
}

export class DependencyInstallError extends DependencyError {
  constructor(message: string) {
    super(message, DependencyErrors.InstallError);
  }
}
