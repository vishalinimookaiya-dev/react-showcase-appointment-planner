import * as React from 'react';
import { useRef, forwardRef, useImperativeHandle, MutableRefObject, useState } from 'react';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { Button, Color } from '@syncfusion/react-buttons';
import { FormValidator, MaskedTextBoxComponent, MaskedTextBox } from '@syncfusion/ej2-react-inputs';
import { TextBox } from '@syncfusion/react-inputs';
import { EJ2Instance } from '@syncfusion/ej2-react-schedule';
import { Dialog } from '@syncfusion/react-popups';
import { DropDownList } from '@syncfusion/react-dropdowns';
import { specializationData as specializationList, experienceData as experienceList, dutyTimingsData as dutyTimingsList } from '../../datasource';
import { useData, useDataDispatch } from '../../context/DataContext';
import { useActivityDispatch } from '../../context/ActivityContext';
import { renderFormValidator, destroyErrorElement } from '../../util';
import './AddEditDoctor.scss';

interface AddEditDoctorProps {
    refreshDoctors?: () => void;
    calendarDropDownObj?: MutableRefObject<any>;
}

export const AddEditDoctor = forwardRef(({ refreshDoctors, calendarDropDownObj }: AddEditDoctorProps, ref) => {
    const dataService = useData();
    const dispatch = useDataDispatch();
    const activityDispatch = useActivityDispatch();
    const newDoctorObj = useRef<any>(null);
    const [isOpen, setIsOpen] = useState(false);

    let doctorsData: Record<string, any>[] = dataService.doctorsData;
    let activeDoctorData: Record<string, any> = dataService.activeDoctorData;
    let dialogState: string;
    let title = 'New Doctor';
    let specializationData: Record<string, any>[] = specializationList;
    let fields: Record<string, any> = { text: 'Text', value: 'Id' };
    let experienceData: Record<string, any>[] = experienceList;
    let dutyTimingsData: Record<string, any>[] = dutyTimingsList;

    useImperativeHandle(ref, () => ({
        showDetails() {
            showDetails();
        },
        onAddDoctor() {
            onAddDoctor();
        }
    }));

    const onAddDoctor = (): void => {
        dialogState = 'new';
        title = 'New Doctor';
        setIsOpen(true);
        newDoctorObj.current.show();
    };

    const onCancelClick = (): void => {
        setIsOpen(false);
        newDoctorObj.current.hide();
    };

    const onSaveClick = (): void => {
        const formElementContainer: HTMLElement = document.querySelector('.new-doctor-dialog #new-doctor-form');
        if (formElementContainer && formElementContainer.classList.contains('e-formvalidator') &&
            !((formElementContainer as EJ2Instance).ej2_instances[0] as FormValidator).validate()) {
            return;
        }

        let obj: Record<string, any> = dialogState === 'new' ? {} : activeDoctorData;
        const formElement: HTMLInputElement[] = [].slice.call(document.querySelectorAll('.new-doctor-dialog .e-field'));

        for (const curElement of formElement) {
            const inputElement: HTMLInputElement = curElement.querySelector('input');
            let columnName: string = inputElement.name;
            const isCustomElement: boolean = curElement.classList.contains('e-ddl');

            if (!isNullOrUndefined(columnName) || isCustomElement) {
                if (columnName === '' && isCustomElement) {
                    columnName = curElement.querySelector('select').name;
                    const instance: any = ((inputElement as Element) as EJ2Instance).ej2_instances[0];
                    obj[columnName] = instance.value;
                    const value: string = instance.value as string;
                    if (columnName === 'Specialization') {
                        obj['DepartmentId'] = (instance.getDataByValue(value) as Record<string, any>)['DepartmentId'];
                    }
                } else if (columnName === 'Gender') {
                    obj[columnName] = inputElement.checked ? 'Male' : 'Female';
                } else {
                    obj[columnName] = inputElement.value;
                }
            }
        }

        if (dialogState === 'new') {
            obj['Id'] = doctorsData.length > 0 ? Math.max.apply(Math, doctorsData.map((data: Record<string, any>) => data['Id'])) + 1 : 1;
            obj['Text'] = 'default';
            obj['Availability'] = 'available';
            obj['NewDoctorClass'] = 'new-doctor';
            obj['Color'] = '#7575ff';
            const initialData: Record<string, any> = JSON.parse(JSON.stringify(dataService.doctorData));
            obj['AvailableDays'] = initialData['AvailableDays'];
            obj['WorkDays'] = initialData['WorkDays'];
            obj = updateWorkHours(obj);
            doctorsData.push(obj);
            dispatch({ type: 'SET_DOCTORS_DATA', data: doctorsData });
        } else {
            activeDoctorData = updateWorkHours(obj);
            dispatch({ type: 'SET_ACTIVE_DOCTOR', data: activeDoctorData });
        }

        const activityObj: Record<string, any> = {
            Name: dialogState === 'new' ? 'Added New Doctor' : 'Updated Doctor',
            Message: `Dr.${obj['Name']}, ${obj['Specialization'].charAt(0).toUpperCase() + obj['Specialization'].slice(1)}`,
            Time: '10 mins ago',
            Type: 'doctor',
            ActivityTime: new Date()
        };

        activityDispatch({ type: 'SET_ACTIVITY_DATA', data: activityObj });

        if (refreshDoctors) {
            refreshDoctors();
        }

        if (!isNullOrUndefined(calendarDropDownObj) && !isNullOrUndefined(calendarDropDownObj.current)) {
            calendarDropDownObj.current.dataSource = [];
            calendarDropDownObj.current.dataSource = doctorsData;
        }

        setIsOpen(false);
        newDoctorObj.current.hide();
    };

    const updateWorkHours = (data: Record<string, any>): Record<string, any> => {
        const dutyString: string = dutyTimingsData.filter((item: Record<string, any>) => item['Id'] === data['DutyTiming'])[0]['Text'];
        let startHour: string;
        let endHour: string;
        let startValue: number;
        let endValue: number;

        if (dutyString === '10:00 AM - 7:00 PM') {
            startValue = 10;
            endValue = 19;
            startHour = '10:00';
            endHour = '19:00';
        } else if (dutyString === '08:00 AM - 5:00 PM') {
            startValue = 8;
            endValue = 17;
            startHour = '08:00';
            endHour = '17:00';
        } else {
            startValue = 12;
            endValue = 21;
            startHour = '12:00';
            endHour = '21:00';
        }

        data['WorkDays'].forEach((item: Record<string, any>) => {
            item['WorkStartHour'] = new Date(new Date(item['WorkStartHour']).setHours(startValue));
            item['WorkEndHour'] = new Date(new Date(item['WorkEndHour']).setHours(endValue));
            item['BreakStartHour'] = new Date(item['BreakStartHour']);
            item['BreakEndHour'] = new Date(item['BreakEndHour']);
        });

        data['StartHour'] = startHour;
        data['EndHour'] = endHour;
        return data;
    };

    const resetFormFields = (): void => {
        const formElement: HTMLInputElement[] = [].slice.call(document.querySelectorAll('.new-doctor-dialog .e-field'));
        destroyErrorElement(document.querySelector('#new-doctor-form'), formElement);

        for (const curElement of formElement) {
            const inputElement: HTMLInputElement = curElement.querySelector('input');
            let columnName: string = inputElement.name;
            const isCustomElement: boolean = curElement.classList.contains('e-ddl');

            if (!isNullOrUndefined(columnName) || isCustomElement) {
                if (columnName === '' && isCustomElement) {
                    columnName = curElement.querySelector('select').name;
                    const instance: any = ((inputElement as Element) as EJ2Instance).ej2_instances[0];
                    instance.value = instance.dataSource[0].Id;
                } else if (columnName === 'Gender') {
                    inputElement.checked = true;
                } else if (columnName === 'Mobile') {
                    (((inputElement as Element) as EJ2Instance).ej2_instances[0] as MaskedTextBox).value = '';
                } else {
                    inputElement.value = '';
                }
            }
        }
    };

    const showDetails = (): void => {
        dialogState = 'edit';
        title = 'Edit Doctor';
        setIsOpen(true);
        newDoctorObj.current.show();
        activeDoctorData = dataService.activeDoctorData;

        const obj: Record<string, any> = activeDoctorData;
        const formElement: HTMLInputElement[] = [].slice.call(document.querySelectorAll('.new-doctor-dialog .e-field'));

        for (const curElement of formElement) {
            const inputElement: HTMLInputElement = curElement.querySelector('input');
            let columnName: string = inputElement.name;
            const isCustomElement: boolean = curElement.classList.contains('e-ddl');

            if (!isNullOrUndefined(columnName) || isCustomElement) {
                if (columnName === '' && isCustomElement) {
                    columnName = curElement.querySelector('select').name;
                    const instance: any = ((inputElement as Element) as EJ2Instance).ej2_instances[0];
                    instance.value = obj[columnName] as string;
                    instance.dataBind();
                } else if (columnName === 'Gender') {
                    if (obj[columnName] === 'Male') {
                        inputElement.checked = true;
                    } else {
                        curElement.querySelectorAll('input')[1].checked = true;
                    }
                } else if (columnName === 'Mobile') {
                    (((inputElement as Element) as EJ2Instance).ej2_instances[0] as MaskedTextBox).value =
                        obj[columnName].replace(/[ -.*+?^${}()|[\]\\]/g, '');
                } else {
                    inputElement.value = obj[columnName] as string;
                }
            }
        }
    };

    const onBeforeOpen = (): void => {
        const formElement: HTMLFormElement = newDoctorObj.current?.element.querySelector('#new-doctor-form');
        if (formElement && formElement['ej2_instances']) {
            return;
        }

        const customFn: (args: { [key: string]: HTMLElement }) => boolean = (e: { [key: string]: HTMLElement }) => {
            const argsLength = ((e['element'] as EJ2Instance).ej2_instances[0] as MaskedTextBoxComponent).value.length;
            return (argsLength !== 0) ? argsLength >= 10 : false;
        };

        const rules: Record<string, any> = {};
        rules['Name'] = { required: [true, 'Enter valid name'] };
        rules['Mobile'] = { required: [customFn, 'Enter valid mobile number'] };
        rules['Email'] = { required: [true, 'Enter valid email'], email: [true, 'Email address is invalid'] };
        rules['Education'] = { required: [true, 'Enter valid education'] };

        renderFormValidator(formElement, rules, newDoctorObj.current.element);
    };

    const onBeforeClose = (): void => {
        resetFormFields();
    };

    const footerTemplate = (): JSX.Element => {
        return (
            <div className="button-container">
                <Button className="e-normal" color={Color.Secondary} onClick={onCancelClick}>Cancel</Button>
                <Button className="e-normal" color={Color.Primary} onClick={onSaveClick}>Save</Button>
            </div>
        );
    };

    return (
        <div className="new-doctor-container" style={{ display: 'none' }}>
            <Dialog
                ref={newDoctorObj}
                style={{ width: '390px' }}
                className="new-doctor-dialog"
                modal={true}
                header={title}
                closeIcon={true}
                open={isOpen}
                footer={footerTemplate()}
                onClose={onBeforeClose}
            >
                <form id="new-doctor-form">
                    <div className="name-container">
                        <TextBox id="Name" name="Name" className="doctor-name e-field" placeholder="Doctor Name" />
                    </div>

                    <div className="gender-container">
                        <div className="gender">
                            <div><label>Gender</label></div>
                            <div className="e-btn-group e-round-corner e-field">
                                <input type="radio" id="patientCheckMale" name="Gender" value="Male" defaultChecked />
                                <label className="e-btn" htmlFor="patientCheckMale">Male</label>
                                <input type="radio" id="patientCheckFemale" name="Gender" value="Female" />
                                <label className="e-btn" htmlFor="patientCheckFemale">Female</label>
                            </div>
                        </div>
                        <div className="mobile">
                            <MaskedTextBoxComponent
                                id="DoctorMobile"
                                name="Mobile"
                                className="e-field"
                                width="180px"
                                placeholder="Mobile Number"
                                mask="(999) 999-9999"
                            />
                        </div>
                    </div>

                    <div className="email-container">
                        <TextBox id="Email" name="Email" className="e-field" placeholder="Email" />
                    </div>

                    <div className="education-container">
                        <div className="department">
                            <DropDownList
                                id="Specialization"
                                width="160px"
                                className="doctor-department e-field"
                                placeholder="Department"
                                dataSource={specializationData}
                                fields={fields}
                            />
                        </div>
                        <div className="education">
                            <TextBox id="Education" name="Education" className="e-field" width="180px" placeholder="Education" />
                        </div>
                    </div>

                    <div className="experience-container">
                        <div className="experience">
                            <DropDownList
                                id="Experience"
                                name="Experience"
                                className="e-field"
                                width="160px"
                                placeholder="Experience"
                                dataSource={experienceData}
                                fields={fields}
                            />
                        </div>
                        <div className="designation">
                            <TextBox id="Designation" name="Designation" className="e-field" width="180px" placeholder="Designation" />
                        </div>
                    </div>

                    <div className="duty-container">
                        <DropDownList
                            id="DutyTiming"
                            className="e-field"
                            width="100%"
                            placeholder="Duty Timing"
                            dataSource={dutyTimingsData}
                            fields={fields}
                        />
                    </div>
                </form>
            </Dialog>
        </div>
    );
});