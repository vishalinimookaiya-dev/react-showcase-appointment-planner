import * as React from 'react';
import { useRef, useEffect, useState, memo, useCallback } from 'react';
import { createElement, Internationalization, closest } from '@syncfusion/ej2-base';
import { Dialog, DialogComponent } from '@syncfusion/ej2-react-popups';
import { Button, Color, Variant } from '@syncfusion/react-buttons';
import { Grid, Columns, Column } from '@syncfusion/react-grid';
import { AddEditPatient } from '../AddEditPatient/AddEditPatient';
import { useData, useDataDispatch } from '../../context/DataContext';
import { updateActiveItem } from '../../util';
import './Patients.scss';

const Patients = () => {
  const dataService = useData();
  const dispatch = useDataDispatch();
  const gridObj = useRef<any>(null);
  const addEditPatientObj = useRef(null);
  const deleteConfirmationDialogObj = useRef<DialogComponent>(null);
  let patientsData: Record<string, any>[] = dataService.patientsData;
  const [filteredPatients, setFilteredPatients] = useState(dataService.patientsData);
  let activePatientData: Record<string, any> = dataService.activePatientData;
  let activePatientHistory: Record<string, any>[] = dataService.activePatientHistory;
  const hospitalData: Record<string, any>[] = dataService.hospitalData;
  const doctorsData: Record<string, any>[] = dataService.doctorsData;
  const intl: Internationalization = new Internationalization();
  let gridDialog: Dialog;
  const animationSettings: Record<string, any> = { effect: 'None' };
  const isPatientClick = useRef(false);

  useEffect(() => {
    updateActiveItem('patients');
  }, []);

  const openPatient = (patient: Record<string, any>) => {
    activePatientData = patient;
    const history = hospitalData.filter((item: Record<string, any>) => item['PatientId'] === patient['Id']);
    activePatientHistory = history;
    dispatch({ type: 'SET_ACTIVE_PATIENT', data: patient });
    dispatch({ type: 'SET_ACTIVE_PATIENT_HISTORY', data: history });
  };

  const onBeginEdit = (args: any) => {
    if (!isPatientClick.current) {
      args.cancel = true;
      (args.row.querySelector('.patient-name') as HTMLElement).click();
    } else {
      isPatientClick.current = false;
    }
  };

  const onDataEdit = (args: any): void => {
    if (args.requestType === 'beginEdit') {
      gridDialog = args.dialog as Dialog;
      gridDialog.header = 'Patient Details';
      const editButtonElement: HTMLElement = createElement('button', {
        className: 'edit-patient',
        id: 'edit',
        innerHTML: 'Edit',
        attrs: { type: 'button', title: 'Edit' }
      });
      editButtonElement.onclick = onEditPatient.bind(this);
      const deleteButtonElement: HTMLElement = createElement('button', {
        className: 'delete-patient',
        id: 'delete',
        innerHTML: 'Delete',
        attrs: { type: 'button', title: 'Delete', content: 'DELETE' }
      });
      deleteButtonElement.onclick = onDeletePatient.bind(this);
      gridDialog.element.querySelector('.e-footer-content').appendChild(deleteButtonElement);
      gridDialog.element.querySelector('.e-footer-content').appendChild(editButtonElement);
    }
  };

  const onDeletePatient = (): void => {
    deleteConfirmationDialogObj.current.show();
  };

  const onDeleteClick = (): void => {
    patientsData = patientsData.filter((item: Record<string, any>) => item['Id'] !== activePatientData['Id']);
    setFilteredPatients(patientsData);
    dispatch({ type: 'SET_PATIENTS_DATA', data: patientsData });
    gridObj.current.closeEdit();
    deleteConfirmationDialogObj.current.hide();
    gridObj.current.dataSource = patientsData;
  };

  const onDeleteCancelClick = (): void => {
    deleteConfirmationDialogObj.current.hide();
  };

  const onAddPatient = (): void => {
    addEditPatientObj.current.onAddPatient();
  };

  const onEditPatient = (): void => {
    gridObj.current.closeEdit();
    addEditPatientObj.current.showDetails();
  };

  const getPatientDOB = (dob: Date): string => {
    return intl.formatDate(dob, { skeleton: 'yMd' });
  };

  const getPatientHistoryContent = (item: Record<string, any>): string => {
    return (
      intl.formatDate(item['StartTime'], { skeleton: 'MMMd' }) + ' - ' +
      intl.formatDate(item['StartTime'], { skeleton: 'hm' }) + ' - ' +
      intl.formatDate(item['EndTime'], { skeleton: 'hm' }) +
      ' Appointment with Dr.' + getDoctorName(item['DoctorId'])
    );
  };

  const getDoctorName = (id: number): string => {
    const activeDoctor: Record<string, any>[] = doctorsData.filter((item: Record<string, any>) => item['Id'] === id);
    return activeDoctor.length > 0 ? activeDoctor[0]['Name'] : 'Unknown';
  };

  const patientSearch = (args: React.ChangeEvent<HTMLInputElement>): void => {
    const searchString: string = args.target.value;
    if (searchString !== '') {
      const result = patientsData.filter((item: Record<string, any>) =>
        ['Id', 'Name', 'Gender', 'BloodGroup', 'Mobile']
          .some((key) => String(item[key] ?? '').toLowerCase().includes(searchString.toLowerCase()))
      );
      setFilteredPatients(result);
    } else {
      setFilteredPatients(patientsData);
    }
  };

  const patientSearchCleared = (args: MouseEvent): void => {
    setFilteredPatients(patientsData);
    if ((args.target as HTMLElement).previousElementSibling) {
      ((args.target as HTMLElement).previousElementSibling as HTMLInputElement).value = '';
    }
  };

  const gridRefresh = (): void => {
    patientsData = dataService.patientsData;
    setFilteredPatients(patientsData);
    gridObj.current.refresh();
  };

  const columnTemplate = useCallback((props: Record<string, any>): JSX.Element => {
    return (
      <span
        className="patient-name"
        onClick={() => {
          openPatient(props);
          gridObj.current?.selectRow?.(props.index ?? 0);
        }}
      >
        {props.Name}
      </span>
    );
  }, [dispatch, hospitalData]);

  const dialogTemplate = (): JSX.Element => {
    return (
      <div className='grid-edit-dialog'>
        <div className='field-row'>
          <label> Patient Id </label><span id='Id'>{activePatientData['Id']}</span>
        </div>
        <div className='field-row'>
          <label> Patient Name </label><span id='Name'>{activePatientData['Name']}</span>
        </div>
        <div className='field-row'>
          <label> Gender </label><span id='Gender'>{activePatientData['Gender']}</span>
        </div>
        <div className='field-row'>
          <label> DOB </label><span id='DOB'>{getPatientDOB(activePatientData['DOB'])}</span>
        </div>
        <div className='field-row'>
          <label> Blood Group </label><span id='BloodGroup'>{activePatientData['BloodGroup']}</span>
        </div>
        <div className='field-row'>
          <label> Mobile Number </label><span id='Mobile'>{activePatientData['Mobile']}</span>
        </div>
        <div className='field-row'>
          <label> Email </label><span id='Email'>{activePatientData['Email']}</span>
        </div>
        <div className='field-row'>
          <label> Symptoms </label><span id='Symptoms'>{activePatientData['Symptoms']}</span>
        </div>
        <div className='field-row history-row'>
          <label>Appointment History</label>
          <div id='history-wrapper'>
            {
              activePatientHistory && activePatientHistory.length > 0 ?
                activePatientHistory.map((item: Record<string, any>, index: number) => {
                  return (
                    <div key={index} className='history-content'>{getPatientHistoryContent(item)}</div>
                  );
                }) : <div className='empty-container'>No Events!</div>
            }
          </div>
        </div>
      </div>
    );
  };

  const footerTemplate = (): JSX.Element => {
    return (
      <div className="button-container">
        <Button className="e-normal" id="delete" onClick={onDeleteClick}>Ok</Button>
        <Button className="e-normal" id="edit" onClick={onEditPatient}>Edit</Button>
      </div>
    );
  };

  return (
    <>
      <div id='patient-wrapper' className="planner-patient-wrapper">
        <header>
          <div className="module-title">
            <div className='title'>PATIENT LIST</div>
            <div className='underline'></div>
          </div>
          <div className='add-patient' onClick={onAddPatient.bind(this)}>
            <div className="e-icon-add e-icons"></div>
            <div className="add-patient-label">Add New</div>
          </div>
        </header>
        <div className="patients-detail-wrapper">
          <div className="patient-operations">
            <div id='searchTemplate' className='search-wrapper planner-patient-search'>
              <div className="e-input-group" role="search">
                <input id="schedule_searchbar" className="e-input" name="input" type="search" placeholder="Search Patient" onKeyUp={patientSearch.bind(this)} />
                <span className="e-clear-icon" aria-label="close" role="button" onClick={patientSearchCleared.bind(this)}></span>
                <span id="schedule_searchbutton" className="e-input-group-icon search-icon e-icons" tabIndex={-1} title="Search" aria-label="search"></span>
              </div>
            </div>
            <Button className="e-normal add-details" onClick={onAddPatient.bind(this)}>Add New Patient</Button>
          </div>
          <div className="patient-display">
            <Grid ref={gridObj} dataSource={filteredPatients} editSettings={{
              allowEdit: true, allowAdd: true,
              allowDelete: true, mode: 'Normal', template: dialogTemplate
            }}>
              <Columns>
                <Column field='Id' width='50' headerText='ID' textAlign='Left' isPrimaryKey={true}></Column>
                <Column field='Name' width='100' textAlign='Left'></Column>
                <Column field='Gender' width='80' textAlign='Left'></Column>
                <Column field='BloodGroup' headerText='Blood Group' width='100' textAlign='Left'></Column>
                <Column field='Symptoms' width='150' textAlign='Left' clipMode='EllipsisWithTooltip'></Column>
                <Column field='Mobile' headerText='Mobile Number' width='100' textAlign='Left'></Column>
                <Column field='Email' headerText='Email' width='120' textAlign='Left'></Column>
              </Columns>
            </Grid>
          </div>
        </div>
      </div>
      <AddEditPatient ref={addEditPatientObj} refreshEvent={gridRefresh.bind(this)} />
      <div className="delete-confirmation-container" style={{ display: 'none' }}>
        <DialogComponent ref={deleteConfirmationDialogObj} width='445px' className='break-hour-dialog' isModal={true}
          visible={false} animationSettings={animationSettings} header='Patient Details' showCloseIcon={true}
          target='#content-area' footerTemplate={footerTemplate.bind(this)}>
          <form>
            <div>Are you sure you want to delete this patient?</div>
          </form>
        </DialogComponent>
      </div>
    </>
  );
};

export default memo(Patients);