import React, {
  FunctionComponent,
  SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useBasename } from '@bf2/ui-shared';
import {
  Button,
  ButtonVariant,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  DropdownToggle,
  Gallery,
  InputGroup,
  Pagination,
  Select,
  SelectOption,
  TextInput,
  Toolbar,
  ToolbarChip,
  ToolbarChipGroup,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  ToolbarToggleGroup,
} from '@patternfly/react-core';
import { FilterIcon, SearchIcon } from '@patternfly/react-icons';

import { BodyLayout } from './BodyLayout';
import { defaultPerPageOptions } from './constants';
import { useCreationWizardMachineKafkasActor } from './CreationWizard.machine-context';
import { useKafkasMachine, useKafkasMachineIsReady } from './Kafkas.machine';
import { Loading } from './Loading';
import { NoMatchFound } from './NoMatchFound';
import { stringToChip } from './stringToChip';
import { useDebounce } from './useDebounce';
import { EmptyState, EmptyStateVariant } from './EmptyState';

export const SelectKafkaInstance: FunctionComponent = () => {
  const actor = useCreationWizardMachineKafkasActor();
  const isReady = useKafkasMachineIsReady(actor);
  return isReady ? <KafkasGallery /> : null;
};
const KafkasGallery: FunctionComponent = () => {
  const { t } = useTranslation();
  const { getBasename } = useBasename();
  const actor = useCreationWizardMachineKafkasActor();
  const {
    response,
    loading,
    error,
    selectedId,
    noResults,
    // results,
    queryEmpty,
    // queryResults,
    firstRequest,
    onSelect,
    onQuery,
  } = useKafkasMachine(actor);

  return (
    <BodyLayout
      title={t('Kafka instance')}
      description={
        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Suscipit error adipisci, ducimus ipsum dicta quo beatae ratione aliquid nostrum animi eos, doloremque laborum quasi sed, vitae ipsa illo delectus! Quos'
      }
    >
      {(() => {
        switch (true) {
          case firstRequest:
            return <Loading />;
          case queryEmpty:
            return (
              <>
                <KafkaToolbar />
                <NoMatchFound onClear={() => onQuery({ page: 1, size: 10 })} />
              </>
            );
          case noResults || error:
            return (
              <EmptyState
                emptyStateProps={{ variant: EmptyStateVariant.GettingStarted }}
                titleProps={{ title: 'cos.no_kafka_instance' }}
                emptyStateBodyProps={{
                  body: 'cos.no_kafka_instance_body',
                }}
                buttonProps={{
                  title: 'cos.create_kafka_instance',
                  variant: ButtonVariant.primary,
                  onClick: () =>
                    window.history.pushState(
                      null,
                      'Create Kafka instance',
                      `${getBasename()}/../streams/kafkas?create=true`
                    ),
                }}
              />
            );
          case loading:
            return (
              <>
                <KafkaToolbar />
                <Loading />
              </>
            );
          default:
            return (
              <>
                <KafkaToolbar />
                <div className={'pf-l-stack__item pf-m-fill pf-u-p-md'}>
                  <Gallery hasGutter>
                    {response?.items?.map((i) => (
                      <Card
                        isHoverable
                        key={i.id}
                        isSelectable
                        isSelected={selectedId === i.id}
                        onClick={() => onSelect(i.id!)}
                      >
                        <CardHeader>
                          <CardTitle>{i.name}</CardTitle>
                        </CardHeader>
                        <CardBody>
                          <DescriptionList>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Region</DescriptionListTerm>
                              <DescriptionListDescription>
                                {i.region}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Owner</DescriptionListTerm>
                              <DescriptionListDescription>
                                {i.owner}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Created</DescriptionListTerm>
                              <DescriptionListDescription>
                                {i.created_at}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                          </DescriptionList>
                        </CardBody>
                      </Card>
                    ))}
                  </Gallery>
                </div>
                <KafkasPagination />
              </>
            );
        }
      })()}
    </BodyLayout>
  );
};

const KafkaToolbar: FunctionComponent = () => {
  const { t } = useTranslation();

  const actor = useCreationWizardMachineKafkasActor();
  const { request, onQuery } = useKafkasMachine(actor);

  const [statusesToggled, setStatusesToggled] = useState(false);
  const [cloudProvidersToggled, setCloudProvidersToggled] = useState(false);
  const [regionsToggled, setRegionsToggled] = useState(false);
  const [categoryToggled, setCategoryToggled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Name');
  const onToggleStatuses = useCallback(
    () => setStatusesToggled((prev) => !prev),
    []
  );
  const onToggleCloudProviders = useCallback(
    () => setCloudProvidersToggled((prev) => !prev),
    []
  );
  const onToggleRegions = useCallback(
    () => setRegionsToggled((prev) => !prev),
    []
  );
  const onFilterCategoryToggle = useCallback(
    () => setCategoryToggled((prev) => !prev),
    []
  );

  const debouncedOnQuery = useDebounce(onQuery, 1000);

  const {
    name,
    owner,
    cloudProviders = [],
    regions = [],
    statuses = [],
  } = request.query || {};

  const clearAllFilters = useCallback(
    () => onQuery({ page: 1, size: request.size }),
    [onQuery, request.size]
  );

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const ownerInputRef = useRef<HTMLInputElement | null>(null);

  const onSelectFilter = (category: string, values: string[], value: string) =>
    onQuery({
      ...request,
      query: {
        ...(request.query || {}),
        [category]: values.includes(value)
          ? values.filter((s) => s !== value)
          : [...(values || []), value],
      },
    });

  const onSelectStatus = (
    _category: string | ToolbarChipGroup,
    value: string | ToolbarChip
  ) => {
    onSelectFilter('statuses', statuses, (value as ToolbarChip).key);
  };

  const onSelectCloudProvider = (
    _category: string | ToolbarChipGroup,
    value: string | ToolbarChip
  ) => {
    onSelectFilter(
      'cloudProviders',
      cloudProviders,
      (value as ToolbarChip).key
    );
  };

  const onSelectRegion = (
    _category: string | ToolbarChipGroup,
    value: string | ToolbarChip
  ) => {
    onSelectFilter('regions', regions, (value as ToolbarChip).key);
  };

  const onDeleteQueryGroup = (category: string) =>
    onQuery({
      ...request,
      query: {
        ...(request.query || {}),
        [category]: undefined,
      },
    });

  const selectCategory = useCallback(
    (event?: SyntheticEvent<HTMLDivElement, Event> | undefined) => {
      const eventTarget = event?.target as HTMLElement;
      const selectedCategory = eventTarget.innerText;
      setSelectedCategory(selectedCategory);
      setCategoryToggled((prev) => !prev);
    },
    []
  );

  // ensure the search input value reflects what's specified in the request object
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.value = name || '';
    }
    if (ownerInputRef.current) {
      ownerInputRef.current.value = owner || '';
    }
  }, [nameInputRef, name, owner]);

  const filterCategoryMenuItems = filterCategoryOptions.map(
    ({ value, label }) => <DropdownItem key={value}>{label}</DropdownItem>
  );
  const statusMenuItems = statusOptions
    .filter((option) => option.value !== 'preparing')
    .map(({ value, label }) => (
      <SelectOption key={value} value={value}>
        {label}
      </SelectOption>
    ));
  const cloudProviderMenuItems = cloudProviderOptions.map(
    ({ value, label }) => (
      <SelectOption key={value} value={value}>
        {label}
      </SelectOption>
    )
  );
  const regionMenuItems = regionOptions.map(({ value, label }) => (
    <SelectOption key={value} value={value}>
      {label}
    </SelectOption>
  ));

  const filterCategoryDropdown = (
    <ToolbarItem>
      <Dropdown
        onSelect={(event) => selectCategory(event)}
        position={DropdownPosition.left}
        toggle={
          <DropdownToggle
            onToggle={onFilterCategoryToggle}
            style={{ width: '100%' }}
          >
            <FilterIcon size="sm" /> {selectedCategory}
          </DropdownToggle>
        }
        isOpen={categoryToggled}
        dropdownItems={filterCategoryMenuItems}
        style={{ width: '100%' }}
      ></Dropdown>
    </ToolbarItem>
  );

  const toggleGroupItems = (
    <>
      <ToolbarGroup variant="filter-group">
        {filterCategoryDropdown}

        <ToolbarFilter
          chips={statuses.map((v) => stringToChip(v, t))}
          deleteChip={onSelectStatus}
          deleteChipGroup={() => onDeleteQueryGroup('statuses')}
          categoryName={t('status')}
          showToolbarItem={selectedCategory === t('status')}
        >
          <Select
            variant={'checkbox'}
            aria-label={t('status')}
            onToggle={onToggleStatuses}
            onSelect={(_, v) =>
              onSelectStatus('', stringToChip(v as string, t))
            }
            selections={statuses}
            isOpen={statusesToggled}
            placeholderText={t('Filter by status')}
          >
            {statusMenuItems}
          </Select>
        </ToolbarFilter>

        <ToolbarFilter
          chips={cloudProviders.map((v) => stringToChip(v, t))}
          deleteChip={onSelectCloudProvider}
          deleteChipGroup={() => onDeleteQueryGroup('cloudProviders')}
          categoryName={t('CloudProvider')}
          showToolbarItem={selectedCategory === t('CloudProvider')}
        >
          <Select
            variant={'checkbox'}
            aria-label={t('CloudProvider')}
            onToggle={onToggleCloudProviders}
            onSelect={(_, v) =>
              onSelectCloudProvider('', stringToChip(v as string, t))
            }
            selections={cloudProviders}
            isOpen={cloudProvidersToggled}
            placeholderText={t('Filter by cloud provider')}
          >
            {cloudProviderMenuItems}
          </Select>
        </ToolbarFilter>

        <ToolbarFilter
          chips={regions.map((v) => stringToChip(v, t))}
          deleteChip={onSelectRegion}
          deleteChipGroup={() => onDeleteQueryGroup('regions')}
          categoryName={t('region')}
          showToolbarItem={selectedCategory === t('region')}
        >
          <Select
            variant={'checkbox'}
            aria-label={t('region')}
            onToggle={onToggleRegions}
            onSelect={(_, v) =>
              onSelectRegion('', stringToChip(v as string, t))
            }
            selections={regions}
            isOpen={regionsToggled}
            placeholderText={t('Filter by region')}
          >
            {regionMenuItems}
          </Select>
        </ToolbarFilter>

        <ToolbarFilter
          chips={name ? [name] : []}
          deleteChip={() => onDeleteQueryGroup('name')}
          categoryName={t('name')}
        >
          {selectedCategory === t('name') && (
            <ToolbarItem>
              <InputGroup>
                <TextInput
                  name={t('name')}
                  id={t('name')}
                  type="search"
                  placeholder={t('nameSearchPlaceholder')}
                  aria-label={t('nameSearchPlaceholder')}
                  onChange={(name) =>
                    debouncedOnQuery({
                      size: request.size,
                      page: 1,
                      query: {
                        ...request.query,
                        name,
                      },
                    })
                  }
                  ref={nameInputRef}
                />
                <Button
                  variant={'control'}
                  aria-label="search button for name input"
                  onClick={() =>
                    onQuery({
                      size: request.size,
                      page: 1,
                      query: {
                        ...request.query,
                        name: nameInputRef.current?.value || '',
                      },
                    })
                  }
                >
                  <SearchIcon />
                </Button>
              </InputGroup>
            </ToolbarItem>
          )}
        </ToolbarFilter>

        <ToolbarFilter
          chips={owner ? [owner] : []}
          deleteChip={() => onDeleteQueryGroup('owner')}
          categoryName={t('owner')}
        >
          {selectedCategory === t('owner') && (
            <ToolbarItem>
              <InputGroup>
                <TextInput
                  name={t('owner')}
                  id={t('owner')}
                  type="search"
                  placeholder={t('ownerSearchPlaceholder')}
                  aria-label={t('ownerSearchPlaceholder')}
                  onChange={(owner) =>
                    debouncedOnQuery({
                      size: request.size,
                      page: 1,
                      query: {
                        ...request.query,
                        owner,
                      },
                    })
                  }
                  ref={ownerInputRef}
                />
                <Button
                  variant={'control'}
                  aria-label="search button for owner input"
                  onClick={() =>
                    onQuery({
                      size: request.size,
                      page: 1,
                      query: {
                        ...request.query,
                        owner: ownerInputRef.current?.value || '',
                      },
                    })
                  }
                >
                  <SearchIcon />
                </Button>
              </InputGroup>
            </ToolbarItem>
          )}
        </ToolbarFilter>
      </ToolbarGroup>
    </>
  );
  const toolbarItems = (
    <>
      <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
        {toggleGroupItems}
      </ToolbarToggleGroup>
      <ToolbarGroup variant="icon-button-group">
        <ToolbarItem>
          <Button variant="primary">Create Kafka Instance</Button>
        </ToolbarItem>
      </ToolbarGroup>
      <ToolbarItem variant="pagination" alignment={{ default: 'alignRight' }}>
        <KafkasPagination isCompact />
      </ToolbarItem>
    </>
  );
  return (
    <Toolbar
      id="toolbar-group-types"
      collapseListedFiltersBreakpoint="xl"
      clearAllFilters={clearAllFilters}
    >
      <ToolbarContent>{toolbarItems}</ToolbarContent>
    </Toolbar>
  );
};

type KeyValueOptions = {
  value: string;
  label: string;
};

// enum InstanceStatus {
//   READY = 'ready',
//   ACCEPTED = 'accepted',
//   PREPARING = 'preparing',
//   PROVISIONING = 'provisioning',
//   FAILED = 'failed',
//   DEPROVISION = 'deprovision',
//   DELETED = 'deleted',
// }

const filterCategoryOptions: KeyValueOptions[] = [
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'cloudprovider', label: 'Cloud Provider' },
  { value: 'region', label: 'Region' },
  { value: 'owner', label: 'Owner' },
];

const cloudProviderOptions: KeyValueOptions[] = [
  { value: 'aws', label: 'Amazon Web Services' },
];

const statusOptions: KeyValueOptions[] = [
  { value: 'ready', label: 'Ready' },
  { value: 'failed', label: 'Failed' },
  { value: 'accepted', label: 'Creation pending' },
  { value: 'provisioning', label: 'Creation in progress' },
  { value: 'preparing', label: 'Creation in progress' },
  { value: 'deprovision', label: 'Deletion in progress' },
];
const regionOptions: KeyValueOptions[] = [
  { value: 'us-east-1', label: 'US East, N. Virginia' },
];

type KafkasPaginationProps = {
  isCompact?: boolean;
};
const KafkasPagination: FunctionComponent<KafkasPaginationProps> = ({
  isCompact = false,
}) => {
  const actor = useCreationWizardMachineKafkasActor();
  const { request, response, onQuery } = useKafkasMachine(actor);

  return (
    <Pagination
      itemCount={response?.total || 0}
      page={request.page}
      perPage={request.size}
      perPageOptions={defaultPerPageOptions}
      onSetPage={(_, page, size) =>
        onQuery({ ...request, page, size: size || request.size })
      }
      onPerPageSelect={() => false}
      variant={isCompact ? 'top' : 'bottom'}
      isCompact={isCompact}
    />
  );
};