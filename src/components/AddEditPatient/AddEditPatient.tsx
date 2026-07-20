import * as React from 'react';
import { useRef, forwardRef, useImperativeHandle, MutableRefObject, useState } from 'react';
import { Color, isNullOrUndefined, Variant } from '@syncfusion/react-base';
import { Button } from '@syncfusion/react-buttons';
import { Dialog } from '@syncfusion/react-popups';
import { DropDownList } from '@syncfusion/react-dropdowns';
import { EJ2Instance } from '@syncfusion/ej2-react-schedule';
import { DatePicker, DatePickerChangeEvent } from '@syncfusion/react-calendars';
import { FormValidator, MaskedTextBoxComponent, MaskedTextBox } from '@syncfusion/ej2-react-inputs';
import { TextBox } from '@syncfusion/react-inputs';
import { useData, useDataDispatch } from '../../context/DataContext';
import { useActivityDispatch } from '../../context/ActivityContext';
import { renderFormValidator, destroyErrorElement } from '../../util';
import './AddEditPatient.scss';

interface AddEditPatientProps {
    refreshEvent?: () => void;
    calendarComboBoxObj?: MutableRefObject<any>;
}

export const AddEditPatient = forwardRef(({ refreshEvent, calendarComboBoxObj }: AddEditPatientProps, ref) => {
    const dataService = useData();
    const dispatch = useDataDispatch();
    const activityDispatch = useActivityDispatch();
    const newPatientObj = useRef<any>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const [dialogState, setDialogState] = React.useState<'new' | 'edit'>('new');
    const [title, setTitle] = React.useState('New Patient');
    const bloodGroupData: Record<string, any>[] = dataService.bloodGroupData;
    const fields: Record<string, any> = { text: 'Text', value: 'Value' };
    let patientsData: Record<string, any>[] = dataService.patientsData;
    let activePatientData: Record<string, any> = dataService.activePatientData;
    const dialogTarget = document.getElementById('content-area') as HTMLElement | null;
    const [dobValue, setDobValue] = React.useState<Date>(new Date());
    const [bloodGroupValue, setBloodGroupValue] = React.useState<string>('');

    useImperativeHandle(ref, () => ({
        showDetails() {
            showDetails();
        },
        onAddPatient() {
            onAddPatient();
        }
    }));

    React.useEffect(() => {
        if (isOpen && dialogState === 'edit') {
            setTimeout(() => {
                activePatientData = dataService.activePatientData;
                const obj: Record<string, any> = activePatientData;
                const formElement: HTMLElement[] = [].slice.call(
                    document.querySelectorAll('.new-patient-dialog .e-field')
                );

                for (const curElement of formElement) {
                    const isCustomElement: boolean = curElement.classList.contains('e-ddl');

                    if (isCustomElement) {
                        const instance: any = (curElement as EJ2Instance).ej2_instances?.[0];
                        if (instance) {
                            const columnName: string = instance.name || instance.element?.name;
                            if (columnName && obj[columnName] !== undefined && obj[columnName] !== null) {
                                instance.value = obj[columnName];
                                instance.dataBind();
                                setTimeout(() => {
                                    instance.value = obj[columnName];
                                    instance.dataBind();
                                }, 50);
                            }
                        }
                    } else {
                        const inputElement: HTMLInputElement = curElement.querySelector('input');
                        if (inputElement) {
                            const columnName: string = inputElement.name;
                            if (!isNullOrUndefined(columnName)) {
                                if (columnName === 'Gender') {
                                    if (obj[columnName] === 'Male') {
                                        inputElement.checked = true;
                                    } else {
                                        curElement.querySelectorAll('input')[1].checked = true;
                                    }
                                } else if (columnName === 'Mobile') {
                                    const maskedInstance: any = (inputElement as any).ej2_instances?.[0];
                                    if (maskedInstance && obj[columnName]) {
                                        maskedInstance.value = obj[columnName].replace(/[ -.*+?^${}()|[\]\\]/g, '');
                                    }
                                } else {
                                    inputElement.value = obj[columnName] || '';
                                }
                            }
                        }
                    }
                }

                setTimeout(() => {
                    const dobInstance = (document.getElementById('DOB') as any)?.ej2_instances?.[0];

                    if (dobInstance && obj['DOB']) {
                        dobInstance.value =
                            obj['DOB'] instanceof Date
                                ? obj['DOB']
                                : new Date(obj['DOB']);

                        dobInstance.dataBind();
                    }

                    const bgInstance = (document.getElementById('BloodGroup') as any)?.ej2_instances?.[0];

                    if (bgInstance && obj['BloodGroup']) {
                        bgInstance.value = obj['BloodGroup'];
                        bgInstance.dataBind();
                    }

                    if (obj['BloodGroup']) {
                        setBloodGroupValue(obj['BloodGroup']);
                    }
                }, 100);
            }, 200);
        } else if (isOpen && dialogState === 'new') {
            resetFormFields();
        }
    }, [isOpen, dialogState]);

    const onAddPatient = (): void => {
        setDialogState('new');
        setTitle('New Patient');
        setIsOpen(true);
    };

    const onCancelClick = (): void => {
        setIsOpen(false);
    };

    const onSaveClick = (): void => {
        const formElementContainer: HTMLElement = document.querySelector('.new-patient-dialog #new-patient-form');
        if (formElementContainer && formElementContainer.classList.contains('e-formvalidator') &&
            !((formElementContainer as EJ2Instance).ej2_instances[0] as FormValidator).validate()) {
            return;
        }

        const obj: Record<string, any> = dialogState === 'new' ? {} : activePatientData;
        const formElements: HTMLElement[] = [].slice.call(document.querySelectorAll('.new-patient-dialog .e-field'));

        for (const curElement of formElements) {
            const isDropElement: boolean = curElement.classList.contains('e-ddl');
            obj['DOB'] = dobValue;

            if (isDropElement) {
                const instance: any = (curElement as EJ2Instance).ej2_instances?.[0];
                if (instance) {
                    const columnName: string = instance.name || instance.element?.name;
                    if (columnName) {
                        obj[columnName] = instance.value;
                    }
                }
            }
            else {
                const inputElement: HTMLInputElement = curElement.querySelector('input');
                if (inputElement) {
                    const columnName: string = inputElement.name;
                    if (!isNullOrUndefined(columnName)) {
                        if (columnName === 'Gender') {
                            obj[columnName] = inputElement.checked ? 'Male' : 'Female';
                        } else {
                            obj[columnName] = inputElement.value;
                        }
                    }
                }
            }
        }

        const dobInstance = (document.getElementById('DOB') as any)?.ej2_instances?.[0];
        if (dobInstance) {
            obj['DOB'] = dobInstance.value;
        }

        obj['BloodGroup'] = bloodGroupValue;

        const dobElement: any = document.getElementById('DOB');
        const dobResetInstance = dobElement?.ej2_instances?.[0];
        if (dobResetInstance) {
            dobResetInstance.value = new Date();
            dobResetInstance.dataBind();
        }

        const bgElement: any = document.getElementById('BloodGroup');
        const bgResetInstance = bgElement?.ej2_instances?.[0];
        if (bgResetInstance) {
            bgResetInstance.value = bgResetInstance.dataSource?.[0]?.Value || '';
            bgResetInstance.dataBind();
        }

        patientsData = dataService.patientsData;

        if (dialogState === 'new') {
            obj['Id'] = patientsData.length > 0
                ? Math.max.apply(Math, patientsData.map((data: Record<string, any>) => data['Id'])) + 1
                : 1;
            obj['NewPatientClass'] = 'new-patient';
            patientsData.push(obj);
        } else {
            activePatientData = obj;
            patientsData.forEach((patientData: Record<string, any>) => {
                if (patientData['Id'] === obj['Id']) {
                    Object.assign(patientData, obj);
                }
            });
            dispatch({ type: 'SET_ACTIVE_PATIENT', data: activePatientData });
        }

        const activityObj: Record<string, any> = {
            Name: dialogState === 'new' ? 'Added New Patient' : 'Updated Patient',
            Message: `${obj['Name']} for ${obj['Symptoms']}`,
            Time: '10 mins ago',
            Type: 'patient',
            ActivityTime: new Date()
        };

        activityDispatch({ type: 'SET_ACTIVITY_DATA', data: activityObj });
        dispatch({ type: 'SET_PATIENTS_DATA', data: patientsData });

        if (refreshEvent) {
            refreshEvent();
        }

        if (!isNullOrUndefined(calendarComboBoxObj) && !isNullOrUndefined(calendarComboBoxObj.current)) {
            calendarComboBoxObj.current.dataSource = [];
            calendarComboBoxObj.current.dataSource = patientsData;
        }

        setIsOpen(false);
    };

    const resetFormFields = (): void => {
        const formElement: HTMLInputElement[] = [].slice.call(document.querySelectorAll('.new-patient-dialog .e-field'));
        destroyErrorElement(document.querySelector('#new-patient-form'), formElement);

        for (const curElement of formElement) {
            const inputElement: Element = curElement.querySelector('input');
            if (!inputElement) {
                continue;
            }

            const columnName: string = (inputElement as HTMLInputElement).name;
            if (columnName === 'Gender') {
                (inputElement as HTMLInputElement).checked = true;
            } else if (columnName === 'Mobile') {
                const maskedInstance: any = (inputElement as any).ej2_instances?.[0];
                if (maskedInstance) {
                    maskedInstance.value = '';
                }
            } else if (columnName) {
                (inputElement as HTMLInputElement).value = '';
            }
        }

        setTimeout(() => {
            const dobInstance = (document.getElementById('DOB') as any)?.ej2_instances?.[0];

            if (dobInstance) {
                dobInstance.value = new Date();
                dobInstance.dataBind();
            }

            const bgInstance = (document.getElementById('BloodGroup') as any)?.ej2_instances?.[0];

            if (bgInstance) {
                bgInstance.value = bloodGroupData?.[0]?.Value || '';
                bgInstance.dataBind();
            }

            setBloodGroupValue(bloodGroupData?.[0]?.Value || '');
        }, 100);
    };

    const showDetails = (): void => {
        activePatientData = dataService.activePatientData;
        setDialogState('edit');
        setTitle('Edit Patient');
        setIsOpen(true);
    };

    const initFormValidator = (): void => {
        const formElement: HTMLFormElement = document.querySelector('.new-patient-dialog #new-patient-form');
        if (!formElement) {
            return;
        }

        const customFn: (args: { [key: string]: HTMLElement }) => boolean = (e: { [key: string]: HTMLElement }) => {
            const argsLength = ((e['element'] as any).ej2_instances[0] as MaskedTextBoxComponent).value.length;
            return argsLength !== 0 ? argsLength >= 10 : false;
        };

        const rules: Record<string, any> = {
            Name: { required: [true, 'Enter valid name'] },
            DOB: { required: true, date: [true, 'Select valid DOB'] },
            Mobile: { required: [customFn, 'Enter valid mobile number'] },
            Email: { required: [true, 'Enter valid email'], email: [true, 'Email address is invalid'] }
        };

        renderFormValidator(formElement, rules, newPatientObj.current.element);
    };

    const onBeforeOpen = (args: any): void => {
        const formElement: HTMLFormElement = args.element.querySelector('#new-patient-form');
        if (formElement && formElement['ej2_instances']) {
            return;
        }

        initFormValidator();
    };

    const onBeforeClose = (): void => {
        resetFormFields();
    };

    const footerTemplate = (): JSX.Element => {
        return (
            <div className="button-container">
                <Button className="e-normal" onClick={onCancelClick} variant={Variant.Outlined} color={Color.Secondary}>
                    Cancel
                </Button>
                <Button className="e-normal" onClick={onSaveClick}>
                    Save
                </Button>
            </div>
        );
    };

    return (
        <div className="new-patient-container" style={{ display: 'none' }}>
            <Dialog
                ref={newPatientObj}
                open={isOpen}
                style={{ width: '390px' }}
                className='new-patient-dialog'
                modal={true}
                header={title}
                closeIcon={true}
                target={dialogTarget ?? undefined}
                footer={footerTemplate()}
                onClose={() => setIsOpen(false)}
            >
                <form id='new-patient-form'>
                    <div className="field-container name-container">
                        <TextBox id='Name' name='Name' className='patient-name e-field' placeholder='Patient Name' labelMode='Always' variant={Variant.Outlined}></TextBox>
                    </div>
                    <div className="field-container gender-container">
                        <div className="gender">
                            <div className='genderLabel'><label>Gender</label></div>
                            <div className='e-btn-group e-round-corner e-field'>
                                <input type="radio" id="doctorCheckMale" name="Gender" value="Male" defaultChecked />
                                <label className="e-btn" htmlFor="doctorCheckMale">Male</label>
                                <input type="radio" id="doctorCheckFemale" name="Gender" value="Female" />
                                <label className="e-btn" htmlFor="doctorCheckFemale">Female</label>
                            </div>
                        </div>
                        <div className="dob e-date-wrapper">
                            <DatePicker
                                id="DOB"
                                className="e-field"
                                value={dobValue}
                                onChange={(args: DatePickerChangeEvent) =>
                                    setDobValue(args.value as Date)
                                }
                                placeholder="DOB"
                                labelMode="Always"
                                clearButton={false}
                                popupSettings={{ zIndex: 1000 }}
                                variant={Variant.Outlined}
                            />
                        </div>
                    </div>
                    <div className="field-container contact-container">
                        <div className="blood-group">
                            <DropDownList
                                id="BloodGroup"
                                name="BloodGroup"
                                value={bloodGroupValue}
                                width="125px"
                                className="e-field e-ddl"
                                placeholder="Blood Group"
                                tabIndex={0}
                                labelMode="Always"
                                dataSource={bloodGroupData}
                                fields={fields}
                                onChange={(args: any) => setBloodGroupValue(args.value as string)}
                                popupSettings={{ zIndex: 1000 }}
                                variant={Variant.Outlined}
                            />
                        </div>
                        <div className="mobile">
                            <MaskedTextBoxComponent id='PatientMobile' name='Mobile' cssClass='e-field' width='180px' placeholder='Mobile Number'
                                mask="(999) 999-9999" floatLabelType='Always'>
                            </MaskedTextBoxComponent>
                        </div>
                    </div>
                    <div className="field-container email-container">
                        <TextBox className='e-field' id='Email' name='Email' placeholder='Email' labelMode='Always' variant={Variant.Outlined}>
                        </TextBox>
                    </div>
                    <div className="field-container symptom-container">
                        <TextBox className='e-field' id='Symptoms' name='Symptoms' placeholder='Symptoms' labelMode='Always' variant={Variant.Outlined}>
                        </TextBox>
                    </div>
                </form>
            </Dialog >
        </div>
    );
});