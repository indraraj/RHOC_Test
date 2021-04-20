import * as React from 'react';
import {
  CreationWizard,
  CreationWizardMachineProvider
} from '@kas-connectors/creation-wizard';
import { AuthContext } from './auth/AuthContext';
import { fetchConfigurator } from './FederatedConfigurator';

export const ConnectedCreationWizard = () => {
  const authContext = React.useContext(AuthContext);

  return (
    <CreationWizardMachineProvider
      authToken={authContext?.getToken ? authContext.getToken() : Promise.resolve('')}
      basePath={process.env.BASE_PATH}
      fetchConfigurator={fetchConfigurator}
    >
      <CreationWizard />
    </CreationWizardMachineProvider>
  );
};