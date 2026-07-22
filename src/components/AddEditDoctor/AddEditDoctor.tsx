import * as React from 'react';
import { useRef, useEffect, forwardRef, useImperativeHandle, MutableRefObject, useState } from 'react';
import { isNullOrUndefined, Variant } from '@syncfusion/react-base';
import { Button, Color } from '@syncfusion/react-buttons';
import { FormValidator, MaskedTextBoxComponent } from '@syncfusion/ej2-react-inputs';
import { TextBox } from '@syncfusion/react-inputs';
import { EJ2Instance } from '@syncfusion/ej2-react-schedule';
import { Dialog } from '@syncfusion/react-popups';
import { DropDownList } from '@syncfusion/react-dropdowns';
import { specializationData as specializationList, experienceData as experienceList, dutyTimingsData as dutyTimingsList } from '../../datasource';
import { useData, useDataDispatch } from '../../context/DataContext';
import { useActivityDispatch } from '../../context/ActivityContext';
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

    // Static data
    const specializationData: Record<string, any>[] = specializationList;
    const experienceData: Record<string, any>[] = experienceList;
    const dutyTimingsData: Record<string, any>[] = dutyTimingsList;
    const fields: Record<string, any> = { text: 'Text', value: 'Id' };
    const availabilityOptions: Record<string, any>[] = [
        { Text: 'Available', Value: 'available' },
        { Text: 'Unavailable', Value: 'unavailable' }
    ];

    // Dialog state
    const [isOpen, setIsOpen] = useState(false);
    const [dialogState, setDialogState] = useState<'new' | 'edit'>('new');
    const [title, setTitle] = useState('New Doctor');

    // Controlled form state
    const [specialization, setSpecialization] = useState<string | number>(specializationData[0].Id);
    const [experience, setExperience] = useState<string | number>(experienceData[0].Id);
    const [dutyTiming, setDutyTiming] = useState<string | number>(dutyTimingsData[0].Id);
    const [availability, setAvailability] = useState<string>('available');
    const [mobile, setMobile] = useState<string>('');

    useImperativeHandle(ref, () => ({
        showDetails() {
            setDialogState('edit');
            setTitle('Edit Doctor');
            setIsOpen(true);
        },
        onAddDoctor() {
            setDialogState('new');
            setTitle('New Doctor');
            setIsOpen(true);
        }
    }));

    // Prefill or reset form when the dialog opens
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        if (dialogState === 'edit') {
            const obj: Record<string, any> = dataService.activeDoctorData || {};
            if (obj['Specialization'] !== undefined && obj['Specialization'] !== null) {
                setSpecialization(obj['Specialization']);
            }
            if (obj['Experience'] !== undefined && obj['Experience'] !== null) {
                setExperience(obj['Experience']);
            }
            if (obj['DutyTiming'] !== undefined && obj['DutyTiming'] !== null) {
                setDutyTiming(obj['DutyTiming']);
            }
            if (obj['Availability'] !== undefined && obj['Availability'] !== null) {
                setAvailability(obj['Availability']);
            }
            setMobile(obj['Mobile'] || '');

            // Push values into the uncontrolled EJ2 inputs
            setTimeout(() => {
                const formElements: HTMLElement[] = [].slice.call(
                    document.querySelectorAll('.new-doctor-dialog .e-field')
                );
                for (const curElement of formElements) {
                    if (curElement.classList.contains('e-ddl')) {
                        continue;
                    }
                    const inputElement: HTMLInputElement = curElement.querySelector('input');
                    if (!inputElement) {
                        continue;
                    }
                    const columnName: string = inputElement.name;
                    if (!columnName) {
                        continue;
                    }
                    if (columnName === 'Gender') {
                        if (obj[columnName] === 'Male') {
                            inputElement.checked = true;
                        } else if (obj[columnName] === 'Female') {
                            (curElement.querySelectorAll('input')[1] as HTMLInputElement).checked = true;
                        }
                    } else if (columnName === 'Mobile') {
                        const maskedInstance: any = (inputElement as any).ej2_instances?.[0];
                        if (maskedInstance && obj[columnName]) {
                            maskedInstance.value = String(obj[columnName]).replace(/[ -.*+?^${}()|[\]\\]/g, '');
                        }
                    } else {
                        inputElement.value = (obj[columnName] as string) || '';
                    }
                }
            }, 150);
        } else {
            // new — reset to defaults
            setSpecialization(specializationData[0].Id);
            setExperience(experienceData[0].Id);
            setDutyTiming(dutyTimingsData[0].Id);
            setAvailability('available');
            setMobile('');

            setTimeout(() => {
                const formElements: HTMLElement[] = [].slice.call(
                    document.querySelectorAll('.new-doctor-dialog .e-field')
                );
                for (const curElement of formElements) {
                    if (curElement.classList.contains('e-ddl')) {
                        continue;
                    }
                    const inputElement: HTMLInputElement = curElement.querySelector('input');
                    if (!inputElement) {
                        continue;
                    }
                    const columnName: string = inputElement.name;
                    if (!columnName) {
                        continue;
                    }
                    if (columnName === 'Gender') {
                        inputElement.checked = true;
                    } else if (columnName === 'Mobile') {
                        const maskedInstance: any = (inputElement as any).ej2_instances?.[0];
                        if (maskedInstance) {
                            maskedInstance.value = '';
                        }
                    } else {
                        inputElement.value = '';
                    }
                }
            }, 150);
        }
    }, [isOpen, dialogState, dataService.activeDoctorData]);

    const onCancelClick = (): void => {
        setIsOpen(false);
    };

    const updateWorkHours = (data: Record<string, any>): Record<string, any> => {
        if (!data['DutyTiming']) {
            data['DutyTiming'] = dutyTimingsData[0]?.Id;
        }
        const dutyString: string = dutyTimingsData.filter(
            (item: Record<string, any>) => item['Id'] === data['DutyTiming']
        )[0]?.['Text'] || '';
        let startHour: string;
        let endHour: string;
        let startValue: number;
        let endValue: number;

        if (dutyString === '10:00 AM - 7:00 PM') {
            startValue = 10; endValue = 19; startHour = '10:00'; endHour = '19:00';
        } else if (dutyString === '08:00 AM - 5:00 PM') {
            startValue = 8; endValue = 17; startHour = '08:00'; endHour = '17:00';
        } else {
            startValue = 12; endValue = 21; startHour = '12:00'; endHour = '21:00';
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

    const onSaveClick = (): void => {
        const formElementContainer: HTMLElement = document.querySelector('.new-doctor-dialog #new-doctor-form');
        if (
            formElementContainer &&
            formElementContainer.classList.contains('e-formvalidator') &&
            !((formElementContainer as EJ2Instance).ej2_instances[0] as FormValidator).validate()
        ) {
            return;
        }

        let obj: Record<string, any> = dialogState === 'new' ? {} : { ...dataService.activeDoctorData };

        // Collect uncontrolled EJ2 inputs (TextBox + Gender + Mobile fallback)
        const formElements: HTMLElement[] = [].slice.call(
            document.querySelectorAll('.new-doctor-dialog .e-field')
        );
        for (const curElement of formElements) {
            if (curElement.classList.contains('e-ddl')) {
                continue;
            }
            const inputElement: HTMLInputElement = curElement.querySelector('input');
            if (!inputElement) {
                continue;
            }
            const columnName: string = inputElement.name;
            if (!columnName) {
                continue;
            }
            if (columnName === 'Gender') {
                obj[columnName] = inputElement.checked ? 'Male' : 'Female';
            } else if (columnName === 'Mobile') {
                const maskedInstance: any = (inputElement as any).ej2_instances?.[0];
                obj[columnName] = maskedInstance ? maskedInstance.value : inputElement.value;
            } else {
                obj[columnName] = inputElement.value;
            }
        }

        // Override with controlled state for the dropdowns + mobile
        obj['Specialization'] = specialization;
        obj['Experience'] = experience;
        obj['DutyTiming'] = dutyTiming;
        obj['Availability'] = availability;
        obj['Mobile'] = mobile;

        // Derive DepartmentId from the selected specialization
        const selectedSpec: Record<string, any> | undefined = specializationData.find(
            (s: Record<string, any>) => s['Id'] === specialization
        );
        if (selectedSpec) {
            obj['DepartmentId'] = selectedSpec['DepartmentId'];
        }

        const doctorsData: Record<string, any>[] = dataService.doctorsData;

        if (dialogState === 'new') {
            obj['Id'] = doctorsData.length > 0
                ? Math.max.apply(Math, doctorsData.map((d: Record<string, any>) => d['Id'])) + 1
                : 1;
            obj['Text'] = 'default';
            obj['NewDoctorClass'] = 'new-doctor';
            obj['Color'] = '#7575ff';
            const initialData: Record<string, any> = JSON.parse(JSON.stringify(dataService.doctorData));
            obj['AvailableDays'] = initialData['AvailableDays'];
            obj['WorkDays'] = initialData['WorkDays'];
            obj = updateWorkHours(obj);
            doctorsData.push(obj);
            dispatch({ type: 'SET_DOCTORS_DATA', data: doctorsData });
        } else {
            obj = updateWorkHours(obj);
            dispatch({ type: 'SET_ACTIVE_DOCTOR', data: obj });
            const updated: Record<string, any>[] = doctorsData.map((d: Record<string, any>) =>
                d['Id'] === obj['Id'] ? obj : d
            );
            dispatch({ type: 'SET_DOCTORS_DATA', data: updated });
        }

        const activityObj: Record<string, any> = {
            Name: dialogState === 'new' ? 'Added New Doctor' : 'Updated Doctor',
            Message: `Dr.${obj['Name']}, ${obj['Specialization']
                ? String(obj['Specialization']).charAt(0).toUpperCase() + String(obj['Specialization']).slice(1)
                : 'N/A'}`,
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
                onClose={() => setIsOpen(false)}
            >
                <form id="new-doctor-form">
                    <div className="name-container">
                        <TextBox id="Name" name="Name" className="doctor-name e-field"
                            placeholder="Doctor Name" labelMode="Always" variant={Variant.Outlined} />
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
                            <div><label>Mobile Number</label></div>
                            <MaskedTextBoxComponent
                                id="DoctorMobile"
                                name="Mobile"
                                className="e-field"
                                placeholder="Mobile Number"
                                mask="(999) 999-9999"
                                value={mobile}
                                change={(e: any) => setMobile(e.value ?? '')}
                            />
                        </div>
                    </div>

                    <div className="email-container">
                        <TextBox id="Email" name="Email" className="e-field"
                            placeholder="Email" labelMode="Always" variant={Variant.Outlined} />
                    </div>

                    <div className="education-container">
                        <div className="department">
                            <DropDownList
                                id="Specialization"
                                name="Specialization"
                                className="doctor-department e-field"
                                placeholder="Department"
                                dataSource={specializationData}
                                fields={fields}
                                labelMode="Always"
                                variant={Variant.Outlined}
                                value={specialization}
                                onChange={(e: any) => setSpecialization(e.value)}
                            />
                        </div>
                        <div className="education">
                            <TextBox id="Education" name="Education" className="e-field"
                                placeholder="Education" labelMode="Always" variant={Variant.Outlined} />
                        </div>
                    </div>

                    <div className="experience-container">
                        <div className="experience">
                            <DropDownList
                                id="Experience"
                                name="Experience"
                                className="e-field"
                                placeholder="Experience"
                                dataSource={experienceData}
                                fields={fields}
                                variant={Variant.Outlined}
                                labelMode="Always"
                                value={experience}
                                onChange={(e: any) => setExperience(e.value)}
                            />
                        </div>
                        <div className="designation">
                            <TextBox id="Designation" name="Designation" className="e-field"
                                placeholder="Designation" labelMode="Always" variant={Variant.Outlined} />
                        </div>
                    </div>

                    <div className="duty-container">
                        <DropDownList
                            id="DutyTiming"
                            name="DutyTiming"
                            className="e-field"
                            placeholder="Duty Timing"
                            dataSource={dutyTimingsData}
                            fields={fields}
                            labelMode="Always"
                            variant={Variant.Outlined}
                            value={dutyTiming}
                            onChange={(e: any) => setDutyTiming(e.value)}
                        />
                    </div>
                </form>
            </Dialog>
        </div>
    );
});