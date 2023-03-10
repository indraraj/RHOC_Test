import { UserProvidedServiceAccount } from '@apis/api';
import { dataToPrettyString, getPasswordType } from '@utils/shared';
import _ from 'lodash';
import React, { FunctionComponent } from 'react';

import {
  Button,
  ClipboardCopyButton,
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
  Tooltip,
} from '@patternfly/react-core';
import {
  EyeIcon,
  EyeSlashIcon,
  FileDownloadIcon,
} from '@patternfly/react-icons';

import { useTranslation } from '@rhoas/app-services-ui-components';
import {
  ConnectorDesiredState,
  ObjectReference,
  ConnectorTypeAllOf,
  ConnectorNamespace,
  ConnectorType,
} from '@rhoas/connector-management-sdk';
import { KafkaRequest } from '@rhoas/kafka-management-sdk';

type ViewJSONFormatProps = {
  kafka: KafkaRequest;
  namespace: ConnectorNamespace;
  connectorType: ConnectorType;
  name: string;
  topic: string;
  userErrorHandler: string;
  userServiceAccount: UserProvidedServiceAccount;
  configString: string;
  configurationSteps?: string[] | false;
};

export const ViewJSONFormat: FunctionComponent<ViewJSONFormatProps> = ({
  kafka,
  namespace,
  connectorType,
  name,
  topic,
  userErrorHandler,
  userServiceAccount,
  configString,
  configurationSteps,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState<boolean>(false);
  const [showSecretFields, setShowSecretFields] =
    React.useState<boolean>(false);

  const downloadTooltipRef = React.useRef();
  const showTooltipRef = React.useRef();
  let timer: any;

  const parsedConfigString = JSON.parse(configString);
  const schema: Record<string, any> = (connectorType as ConnectorTypeAllOf)
    .schema!;
  const connectorTypeConfig = connectorType as ConnectorTypeAllOf;
  const combinedConfig = Object.assign(
    { name: name },
    { kind: 'ConnectorType' },
    { channels: connectorTypeConfig.channels },
    { connector_type_id: (connectorType as ObjectReference).id! },
    { desired_state: ConnectorDesiredState.Ready },
    {
      kafka: {
        id: kafka.id!,
        url: kafka.bootstrap_server_host || 'demo',
      },
    },
    { namespace_id: namespace.id },
    {
      service_account: {
        client_id: userServiceAccount.clientId,
        client_secret: showSecretFields
          ? userServiceAccount.clientSecret
          : '*'.repeat(userServiceAccount.clientSecret.length),
      },
    },

    {
      connector: configurationSteps
        ? {
            ...parsedConfigString,
          }
        : {
            ...parsedConfigString,
            ...{
              error_handler: {
                [userErrorHandler]: topic ? { topic: topic } : {},
              },
            },
          },
    }
  );

  const configPrettyString = dataToPrettyString(combinedConfig);
  function maskPropertyValues(inputObj: any) {
    const dataToHide = getPasswordType(schema).concat('client_secret');
    const json = JSON.stringify(
      inputObj,
      (key, value) => {
        return dataToHide.indexOf(key) === -1 ? value : '*'.repeat(5);
      },
      2
    );
    return json;
  }

  const getJson = (properties: any, showHiddenFields: boolean) => {
    return showHiddenFields
      ? properties
      : maskPropertyValues(JSON.parse(properties));
  };

  const clipboardCopyFunc = (event: any, text: string) => {
    const clipboard = event.currentTarget.parentElement;
    const el = document.createElement('textarea');
    el.value = text.toString();
    clipboard.appendChild(el);
    el.select();
    document.execCommand('copy');
    clipboard.removeChild(el);
  };

  const onClick = (event: any, text: string) => {
    if (timer) {
      window.clearTimeout(timer);
      setCopied(false);
    }
    clipboardCopyFunc(event, text);
    setCopied(true);
  };

  const downloadFile = async (event: any, data: any) => {
    const downloadJson = event.currentTarget.parentElement;
    const file = 'connectorConfig.json';
    const json = data;
    const blob = new Blob([json], { type: 'application/json' });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = file;
    downloadJson.appendChild(link);
    link.click();
    downloadJson.removeChild(link);
  };

  const actions = (
    <React.Fragment>
      <CodeBlockAction>
        <Button
          variant="plain"
          ref={showTooltipRef}
          aria-label="show hidden fields icon"
          onClick={() => setShowSecretFields(!showSecretFields)}
        >
          {showSecretFields ? <EyeSlashIcon /> : <EyeIcon />}
        </Button>
        <Tooltip
          content={
            <div>
              {showSecretFields ? t('hideSecretFields') : t('showSecretFields')}
            </div>
          }
          reference={showTooltipRef}
        />
      </CodeBlockAction>
      <CodeBlockAction>
        <ClipboardCopyButton
          id="copy-button"
          textId="code-content"
          aria-label="Copy to clipboard"
          onClick={(e) =>
            onClick(e, getJson(configPrettyString, showSecretFields))
          }
          exitDelay={600}
          maxWidth="110px"
          variant="plain"
        >
          {copied ? 'Successfully copied to clipboard!' : 'Copy to clipboard'}
        </ClipboardCopyButton>
      </CodeBlockAction>
      <CodeBlockAction>
        <Button
          variant="plain"
          ref={downloadTooltipRef}
          aria-label="Download icon"
          onClick={(e) =>
            downloadFile(e, getJson(configPrettyString, showSecretFields))
          }
        >
          <FileDownloadIcon />
        </Button>
        <Tooltip
          content={<div>Download JSON</div>}
          reference={downloadTooltipRef}
        />
      </CodeBlockAction>
    </React.Fragment>
  );
  return (
    <CodeBlock actions={actions}>
      <CodeBlockCode id="code-content">
        {getJson(configPrettyString, showSecretFields)}
      </CodeBlockCode>
    </CodeBlock>
  );
};
