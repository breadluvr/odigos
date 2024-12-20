import React, { useEffect, useMemo, useState } from 'react';
import buildCard from './build-card';
import styled from 'styled-components';
import { useSourceCRUD } from '@/hooks';
import { useDrawerStore } from '@/store';
import buildDrawerItem from './build-drawer-item';
import { UpdateSourceBody } from '../update-source-body';
import OverviewDrawer from '../../overview/overview-drawer';
import { OVERVIEW_ENTITY_TYPES, type WorkloadId, type K8sActualSource } from '@/types';
import { ACTION, DATA_CARDS, getMainContainerLanguage, getProgrammingLanguageIcon } from '@/utils';
import { ConditionDetails, DataCard, DataCardRow, DataCardFieldTypes } from '@/reuseable-components';

interface Props {}

const EMPTY_FORM = {
  reportedName: '',
};

const FormContainer = styled.div`
  width: 100%;
  height: 100%;
  max-height: calc(100vh - 220px);
  overflow: overlay;
  overflow-y: auto;
`;

const DataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const SourceDrawer: React.FC<Props> = () => {
  const { selectedItem, setSelectedItem } = useDrawerStore();

  const { deleteSources, updateSource } = useSourceCRUD({
    onSuccess: (type) => {
      setIsEditing(false);
      setIsFormDirty(false);

      if (type === ACTION.DELETE) {
        setSelectedItem(null);
      } else {
        const { item } = selectedItem as { item: K8sActualSource };
        const { namespace, name, kind } = item;
        const id = { namespace, name, kind };
        setSelectedItem({ id, type: OVERVIEW_ENTITY_TYPES.SOURCE, item: buildDrawerItem(id, formData, item) });
      }
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const handleFormChange = (key: keyof typeof EMPTY_FORM, val: any) => setFormData((prev) => ({ ...prev, [key]: val }));
  const resetFormData = () => setFormData({ ...EMPTY_FORM });

  useEffect(() => {
    if (!selectedItem || !isEditing) {
      resetFormData();
    } else {
      const { item } = selectedItem as { item: K8sActualSource };
      handleFormChange('reportedName', item.reportedName || item.name || '');
    }
  }, [selectedItem, isEditing]);

  const cardData = useMemo(() => {
    if (!selectedItem) return [];

    const { item } = selectedItem as { item: K8sActualSource };
    const arr = buildCard(item);

    return arr;
  }, [selectedItem]);

  const containersData = useMemo(() => {
    if (!selectedItem) return [];

    const { item } = selectedItem as { item: K8sActualSource };

    return (
      item.instrumentedApplicationDetails.containers.map(
        (container) =>
          ({
            type: DataCardFieldTypes.SOURCE_CONTAINER,
            width: '100%',
            value: JSON.stringify(container),
          } as DataCardRow),
      ) || []
    );
  }, [selectedItem]);

  if (!selectedItem?.item) return null;
  const { id, item } = selectedItem as { id: WorkloadId; item: K8sActualSource };

  const handleEdit = (bool?: boolean) => {
    setIsEditing(typeof bool === 'boolean' ? bool : true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsFormDirty(false);
  };

  const handleDelete = async () => {
    const { namespace } = item;
    await deleteSources({ [namespace]: [item] });
  };

  const handleSave = async () => {
    const title = formData.reportedName !== item.name ? formData.reportedName : '';
    handleFormChange('reportedName', title);
    await updateSource(id, { ...formData, reportedName: title });
  };

  return (
    <OverviewDrawer
      title={item.reportedName || item.name}
      titleTooltip='This attribute is used to identify the name of the service (service.name) that is generating telemetry data.'
      imageUri={getProgrammingLanguageIcon(getMainContainerLanguage(item))}
      isEdit={isEditing}
      isFormDirty={isFormDirty}
      onEdit={handleEdit}
      onSave={handleSave}
      onDelete={handleDelete}
      onCancel={handleCancel}
    >
      {isEditing ? (
        <FormContainer>
          <UpdateSourceBody
            formData={formData}
            handleFormChange={(...params) => {
              setIsFormDirty(true);
              handleFormChange(...params);
            }}
          />
        </FormContainer>
      ) : (
        <DataContainer>
          <ConditionDetails conditions={item.instrumentedApplicationDetails.conditions} />
          <DataCard title={DATA_CARDS.SOURCE_DETAILS} data={cardData} />
          <DataCard title={DATA_CARDS.DETECTED_CONTAINERS} titleBadge={containersData.length} description={DATA_CARDS.DETECTED_CONTAINERS_DESCRIPTION} data={containersData} />
        </DataContainer>
      )}
    </OverviewDrawer>
  );
};
