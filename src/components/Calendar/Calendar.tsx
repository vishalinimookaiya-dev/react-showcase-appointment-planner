import * as React from 'react';
import { useRef, useEffect, useCallback, memo, useState } from 'react';
import {
    closest, Browser, Internationalization, extend, isNullOrUndefined, createElement
} from '@syncfusion/ej2-base';
import { Query, Predicate, DataManager } from '@syncfusion/react-data';
import { Toast } from '@syncfusion/react-notifications';
import { Button } from '@syncfusion/react-buttons';
import { Dialog } from '@syncfusion/react-popups';
import { ItemModel } from '@syncfusion/ej2-react-navigations';
import {
    Scheduler, DayView, WeekView, WorkWeekView, MonthView, AgendaView
} from '@syncfusion/react-scheduler';
import { DropDownList, ComboBox } from '@syncfusion/react-dropdowns';
import { AddEditDoctor } from '../AddEditDoctor/AddEditDoctor';
import { AddEditPatient } from '../AddEditPatient/AddEditPatient';
import { TreeWaitingList } from './TreeWaitingList/TreeWaitingList';
import { DialogWaitingList } from './DialogWaitingList/DialogWaitingList';
import { CalendarSettings } from '../../models/calendar-settings';
import { CalendarData } from '../../models/calendar-data';
import { useData, useDataDispatch } from '../../context/DataContext';
import { useActivityDispatch } from '../../context/ActivityContext';
import { errorPlacement, updateActiveItem, loadImage, getString } from '../../util';
import doctorsIcon from '../../assets/Icons/Doctors.svg';
import './Calendar.scss';

const Calendar = () => {
    const dataService = useData();
    const dispatch = useDataDispatch();
    const activityDispatch = useActivityDispatch();
    const addEditDoctorObj = useRef(null);
    const addEditPatientObj = useRef(null);
    const scheduleObj = useRef<any>(null);
    const specialistObj = useRef<any>(null);
    const dropdownObj = useRef<any>(null);
    const toastObj = useRef<any>(null);
    const treeObj = useRef(null);
    const waitingObj = useRef(null);
    const [isOpen, setIsOpen] = useState(false);

    const isDevice: boolean = Browser.isDevice;
    const position: Record<string, any> = { X: 'Right', Y: 'Bottom' };
    const isTreeItemDropped = useRef(false);
    const patientValue = useRef(null);
    const group = { resources: ['Departments', 'Doctors'] };
    const instance: Internationalization = new Internationalization();
    const [workDays, setWorkDays] = useState([0, 1, 2, 3, 4, 5, 6]);
    const [workHours, setWorkHours] = useState({ start: '08:00', end: '21:00' });
    const animationSettings: Record<string, any> = { effect: 'None' };
    const comboBox = useRef<any>(null);
    const fields: Record<string, any> = { text: 'Name', value: 'Id' };
    const eventData = useRef(dataService.hospitalData);
    const hospitalData = useRef(dataService.hospitalData);
    let maxAppointmentID: number = hospitalData.current.length > 0 ? hospitalData.current[hospitalData.current.length - 1]['Id'] : 1028 as number;
    const calendarSettings: CalendarSettings = dataService.calendarSettings;
    const minValidation = (args: { [key: string]: string }): boolean => {
        return args.value.length >= 5
    }
    const nameValidation = (args: { [key: string]: string }): boolean => {
        return dataService.patientsData.filter((item: Record<string, any>) => item.Name === args.value).length > 0;
    }
    const eventSettings = useRef({
    dataSource: eventData.current as Record<string, any>[],
    fields: {
        subject: 'Name',
        startTime: 'StartTime',
        endTime: 'EndTime',
        description: 'Symptoms'
    },
    resourceColorField: calendarSettings.bookingColor as string
});
    const patientsData: Record<string, any>[] = dataService.patientsData;
    const specialistCategory: Record<string, any>[] = dataService.specialistData;
    const activeDoctorData = useRef([]);
    const specialistData: Record<string, any>[] = dataService.doctorsData;
    const doctorsData: Record<string, any>[] = dataService.doctorsData;
    const resourceDataSource: Record<string, any>[] = dataService.doctorsData;
    const startHour = calendarSettings.calendar['start'];
    const endHour: string = calendarSettings.calendar['end'];
    const timeScale = { interval: calendarSettings.interval };
    const currentView = calendarSettings.currentView;
    const [selectedDate, setSelectedDate] = useState(dataService.selectedDate);
    const [selectedDoctor, setSelectedDoctor] = useState<Record<string, any> | null>(null);
    const [schedulerEvents, setSchedulerEvents] = useState<Record<string, any>[]>(dataService.hospitalData);
    const currentDate = useRef(selectedDate);
    const toastWidth = isDevice ? '300px' : '580px';

    useEffect(() => {
        updateActiveItem('calendar');
        setIsOpen(false);
    }, []);

    const onActionBegin = (args: Record<string, any>): void => {
        if (args.requestType === 'eventCreate' || args.requestType === 'eventChange') {
            const data: Record<string, any> = (args.requestType === 'eventCreate' ? (args.data as Record<string, any>[])[0] :
                (args.changedRecords as Record<string, any>[])[0]);
            if (patientValue.current) {
                data['PatientId'] = patientValue.current;
                data['Name'] = patientsData.filter((item: Record<string, any>) => item['Id'] === patientValue.current)[0]['Name'];
            }
            let eventCollection: Record<string, any>[] = scheduleObj.current.eventBase.filterEvents(data['StartTime'] as Date, data['EndTime'] as Date);
            const predicate: Predicate = new Predicate('Id', 'notequal', data['Id'] as number)
                .and(new Predicate('DepartmentId', 'equal', data['DepartmentId'] as number))
                .and(new Predicate('DoctorId', 'equal', data['DoctorId'] as number))
                .and(new Predicate('Id', 'notequal', data['RecurrenceID'] as number));
            eventCollection = new DataManager({ json: eventCollection }).executeLocal(new Query().where(predicate));
            if (eventCollection.length > 0) {
                args.cancel = true;
                toastObj.current.content = 'An appointment already exists on the same time range, so please reschedule on different time slots.';
                if (args.requestType === 'eventCreate') {
                    treeObj.current.addWaitingListItem(data);
                    toastObj.current.content = 'An appointment already exists on the same time range, so it is added to the waiting list';
                }
                toastObj.current.show();
            } else if (isTreeItemDropped.current) {
                treeObj.current.updateWaitingListItem();
            }
            if (!args.cancel) {
                if (args.requestType === 'eventCreate' && args.addedRecords[0].Id <= maxAppointmentID) {
                    args.addedRecords.forEach((item: Record<string, any>) => { item.Id = ++maxAppointmentID; });
                }
                const activityData: Record<string, any> = {
                    Name: args.requestType === 'eventCreate' ? 'Added New Appointment' : 'Updated Appointment',
                    Message: `${data['Name']} for ${data['Symptoms']}`,
                    Time: '5 mins ago',
                    Type: 'appointment',
                    ActivityTime: new Date()
                };
                activityDispatch({ type: 'SET_ACTIVITY_DATA', data: activityData });
            }
            isTreeItemDropped.current = false;
        }
        if (args.requestType === 'toolbarItemRendering') {
            if (Browser.isDevice) {
                const doctorIcon: ItemModel = {
                    align: 'Center',
                    cssClass: 'app-doctor-icon',
                    overflow: 'Show',
                    prefixIcon: 'doctor-icon',
                    showAlwaysInPopup: true
                };
                args.items.unshift(doctorIcon);
                const waitingListItem: ItemModel = {
                    align: 'Right',
                    cssClass: 'app-waiting-list',
                    showAlwaysInPopup: true,
                    text: 'Waiting list',
                    click: onWaitingListSelect.bind(this)
                };
                args.items.push(waitingListItem);
                args.items.splice(5, 1);
            }
        }
    }

    const onActionComplete = (args: Record<string, any>): void => {
        if (args.requestType === 'toolBarItemRendered') {
            if (Browser.isDevice) {
                const doctorIconContainer: HTMLElement = scheduleObj.current.element.querySelector('.app-doctor-icon') as HTMLElement;
                const doctorIcon: HTMLElement = doctorIconContainer.querySelector('.doctor-icon');
                const doctorImage: HTMLElement = createElement('img', { className: 'active-doctor', attrs: { src: doctorsIcon } });
                doctorIcon.appendChild(doctorImage);
                doctorIconContainer.style.display = 'block';
                doctorIconContainer.onclick = () => specialistObj.current.show();
            }
        }
        if (document.body.style.cursor === 'not-allowed') {
            document.body.style.cursor = '';
        }
        if (args.requestType === 'eventCreated' || args.requestType === 'eventChanged' || args.requestType === 'eventRemoved') {
            if (activeDoctorData.current.length > 0) {
                if (args.addedRecords.length > 0) {
                    args.addedRecords.forEach((item: Record<string, any>) => { hospitalData.current.push(item); });
                }
                if (args.deletedRecords.length > 0) {
                    args.deletedRecords.forEach((item: Record<string, any>) => {
                        hospitalData.current = hospitalData.current.filter((data: Record<string, any>) => data['Id'] !== item['Id']);
                    });
                }
            }
            dispatch({ type: 'SET_HOSPITAL_DATA', data: hospitalData.current });
            treeObj.current.updateActiveWaitingList();
        }
    }

    const onPopupOpen = (args: Record<string, any>): void => {
        if (args.type === 'Editor') {
            // additional field customization
            if (!args.element.querySelector('.custom-field-row')) {
                const row: HTMLElement = createElement('div', { className: 'custom-field-row' });
                const formElement: HTMLElement = args.element.querySelector('.e-schedule-form');
                formElement.firstChild.insertBefore(row, args.element.querySelector('.e-title-location-row'));
                const container: HTMLElement = createElement('div', { className: 'custom-field-container' });
                const comboBoxElement: HTMLInputElement = createElement('input', { attrs: { id: 'PatientName' } }) as HTMLInputElement;
                container.appendChild(comboBoxElement);
                row.appendChild(container);
                comboBox.current.appendTo({
                    dataSource: patientsData,
                    allowFiltering: true,
                    fields: { text: 'Name', value: 'Id' },
                    floatLabelType: 'Always',
                    placeholder: 'PATIENT NAME',
                    change: (e: any) => patientValue.current = e.value,
                    select: () => {
                        if (!isNullOrUndefined(document.querySelector('.custom-field-row .field-error'))) {
                            (document.querySelector('.custom-field-row .field-error') as HTMLElement).style.display = 'none';
                        }
                    }
                });
                comboBox.current.appendTo(comboBoxElement);
                comboBoxElement.setAttribute('name', 'Name');
                const buttonEle = createElement('button', { attrs: { name: 'PatientButton' } }) as HTMLButtonElement;
                buttonEle.onclick = onAddPatient.bind(this);
                container.appendChild(buttonEle);
            }
            comboBox.current.value = args.data['PatientId'] || null;
        }
        if (args.type === 'QuickInfo') {
            if (args.target.classList.contains('e-work-cells') || args.target.classList.contains('e-header-cells')) {
                scheduleObj.current.closeQuickInfoPopup();
                args.cancel = true;
            } else if (args.target.classList.contains('e-appointment')) {
                (args.element as HTMLElement).style.boxShadow = `1px 2px 5px 0 ${(args.target as HTMLElement).style.backgroundColor}`;
            }
        }
        if (args.type === 'EventContainer') {
            const eventElements: NodeListOf<HTMLElement> = args.element.querySelectorAll('.e-appointment');
            eventElements.forEach((element: HTMLElement) => { (element.querySelector('.e-subject') as HTMLElement).style.color = '#fff'; });
        }
    }

    const onPopupClose = (args: Record<string, any>): void => {
        if (isTreeItemDropped.current && args.type === 'Editor' && !args.data) {
            isTreeItemDropped.current = false;
        }
    }

    const onEventRendered = (args: Record<string, any>): void => {
        if (args['element'].classList.contains('e-appointment')) {
            const data: Record<string, any> = args['data'] as Record<string, any>;
            const subject = (data['Name'] || '').toString().toLowerCase();

            args['element'].style.color = '#fff';
        }
    };

    const onAddPatient = (): void => {
        addEditPatientObj.current.onAddPatient();
    }

    const getEventDetails = (data: Record<string, any>): string => {
        return (instance.formatDate(new Date(data['StartTime']), { type: 'date', skeleton: 'long' }) +
            '(' + getString(new Date(data['StartTime']), 'hm', instance) + '-' + getString(new Date(data['EndTime']), 'hm', instance) + ')');
    }

    const getPatientName = (data: Record<string, any>): string => {
        return patientsData.filter((item: Record<string, any>) => item['Id'] === data['PatientId'])[0]['Name'].toString();
    }

    const getDoctorName = (data: Record<string, any>): string => {
        if (!isNullOrUndefined(data['DoctorId'])) {
            return 'Dr. ' + doctorsData.filter((item: Record<string, any>) => item['Id'] === data['DoctorId'])[0]['Name'].toString();
        } else {
            return specialistCategory.filter((item: Record<string, any>) => item['DepartmentId'] === data['DepartmentId'])[0]['Text'].toString();
        }
    }

    const onDoctorSelect = (args: Record<string, any>): void => {
        if (args['value']) {
            refreshDataSource(args['itemData'].DepartmentId, args['itemData'].Id);
        } else {
            setSelectedDoctor(null);
            setSchedulerEvents(hospitalData.current);
            activeDoctorData.current = [];
            setWorkDays([0, 1, 2, 3, 4, 5, 6]);
            setWorkHours({ start: '08:00', end: '21:00' });
            setSelectedDate(dataService.selectedDate);
            if (treeObj.current) {
                treeObj.current.updateActiveWaitingList(null);
            }
        }
    };

    const refreshDataSource = (deptId: string, doctorId: string): void => {
        const filteredItems: Record<string, any>[] = doctorsData.filter(item => parseInt(doctorId, 10) === item['Id']);
        const selectedDoctorData = filteredItems.length > 0 ? filteredItems[0] : null;

        setSelectedDoctor(selectedDoctorData);
        activeDoctorData.current = selectedDoctorData ? [selectedDoctorData] : [];

        if (selectedDoctorData) {
            const baseDate = currentDate.current || selectedDate;
            updateBreakHours(baseDate);
            const generatedEvents = generateEvents(selectedDoctorData);
            eventData.current = generatedEvents;
            setSchedulerEvents(generatedEvents);
            setWorkDays(selectedDoctorData['AvailableDays']);
            setWorkHours({ start: selectedDoctorData['StartHour'], end: selectedDoctorData['EndHour'] });
        } else {
            eventData.current = hospitalData.current;
            setSchedulerEvents(hospitalData.current);
            setWorkDays([0, 1, 2, 3, 4, 5, 6]);
            setWorkHours({ start: '08:00', end: '21:00' });
        }

        if (treeObj.current) {
            treeObj.current.updateWaitingList(parseInt(deptId, 10), parseInt(doctorId, 10), null);
        }
    }

    const onAddClick = (): void => {
        addEditDoctorObj.current.onAddDoctor();
    }

    const createNewEvent = (e: MouseEvent): void => {
        const args = e as Record<string, any> & MouseEvent;
        let data: Record<string, any>;
        const isSameTime: boolean =
            scheduleObj.current.activeCellsData.startTime.getTime() === scheduleObj.current.activeCellsData.endTime.getTime();
        if (scheduleObj.current.activeCellsData && !isSameTime) {
            data = scheduleObj.current.activeCellsData;
        } else {
            const interval: number = scheduleObj.current.activeViewOptions.timeScale.interval;
            const slotCount: number = scheduleObj.current.activeViewOptions.timeScale.slotCount;
            const msInterval: number = (interval * 60000) / slotCount;
            const startTime: Date = new Date(scheduleObj.current.selectedDate.getTime());
            startTime.setHours(new Date().getHours(), Math.round(startTime.getMinutes() / msInterval) * msInterval, 0);
            const endTime: Date = new Date(new Date(startTime.getTime()).setMilliseconds(startTime.getMilliseconds() + msInterval));
            data = { startTime, endTime, isAllDay: false };
        }
        scheduleObj.current.openEditor(extend(data, { cancel: false, event: args.event }), 'Add');
    }

    const onSpecialistSelect = (args: Record<string, any>): void => {
        const target: HTMLElement = closest(args['target'], '.specialist-item') as HTMLElement;
        const deptId: string = target.getAttribute('data-deptid');
        const doctorId: string = target.getAttribute('data-doctorid');
        refreshDataSource(deptId, doctorId);

        const doctorImage: HTMLElement = scheduleObj.current.element.querySelector('.doctor-icon .active-doctor');
        doctorImage.setAttribute('src', loadImage(activeDoctorData.current[0]['Text']));

        setIsOpen(false);
    };

    const onBackIconClick = (): void => {
        setIsOpen(false);
    };

    const onWaitingListSelect = (): void => {
        if (waitingObj.current) {
            waitingObj.current.show();
        }
    }

    const getCalendarData = (): CalendarData => {
        return {
            scheduleObj: scheduleObj.current, toastObj: toastObj.current, treeObj: treeObj.current,
            currentDate: currentDate.current, activeDoctorData: activeDoctorData.current
        };
    }

    const updateEventData = (data: Record<string, any>[]): void => {
        eventData.current = data;
        setSchedulerEvents(data);
    }

    const setTreeItemDrop = (): void => {
        isTreeItemDropped.current = true;
    }

    const updateActiveWaitingList = (currentWaitingList?: Record<string, any>[]) => {
        const activeDoctorData: Record<string, any>[] = getCalendarData().activeDoctorData;
        if (activeDoctorData.length > 0) {
            treeObj.current.updateWaitingList(activeDoctorData[0]['DepartmentId'], activeDoctorData[0]['Id'], currentWaitingList);
        } else {
            treeObj.current.updateWaitingList(null, null, currentWaitingList);
        }
    }

    const getDateHeaderText: Function = (value: Date): string => instance.formatDate(value, { skeleton: 'MMMEd' }).toUpperCase();

    const getBackGroundColor = (data: Record<string, any>): Record<string, string> => {
        const subject = (data['Name'] || '').toString().toLowerCase();

        let color: string;
        if (calendarSettings.bookingColor === 'Doctors' && !isNullOrUndefined(data['DoctorId'])) {
            color = doctorsData.filter((item: Record<string, any>) => item['Id'] === data['DoctorId'])[0]['Color'] as string || '#7575ff';
        } else {
            color = specialistCategory.filter((item: Record<string, any>) =>
                item['DepartmentId'] === data['DepartmentId'])[0]['Color'] as string;
        }
        return { backgroundColor: color, color: '#FFFFFF' };
    }

    const onNavigation = (args: Record<string, any>): void => {
        currentDate.current = args.currentDate || selectedDate;
        if (args.action === 'dateNavigate') {
            setSelectedDate(currentDate.current);
        }
        if (activeDoctorData.current.length > 0) {
            updateBreakHours(currentDate.current);
            eventData.current = generateEvents(activeDoctorData.current[0]);
            scheduleObj.current.eventSettings.dataSource = eventData.current;
            treeObj.current.updateWaitingList(activeDoctorData.current[0]['DepartmentId'], activeDoctorData.current[0]['Id'], null);
        } else {
            treeObj.current.updateActiveWaitingList();
        }
    }

    const updateBreakHours = (currentDate: Date): void => {
        if (!activeDoctorData.current || activeDoctorData.current.length === 0) {
            return;
        }

        const activeDoctor = activeDoctorData.current[0];
        const workDays = Array.isArray(activeDoctor.WorkDays) ? activeDoctor.WorkDays : [];

        activeDoctor.WorkDays = workDays.map((dayItem: Record<string, any>) => {
            return {
                ...dayItem,
                WorkStartHour: resetDateValue(new Date(dayItem.WorkStartHour), currentDate),
                WorkEndHour: resetDateValue(new Date(dayItem.WorkEndHour), currentDate),
                BreakStartHour: resetDateValue(new Date(dayItem.BreakStartHour), currentDate),
                BreakEndHour: resetDateValue(new Date(dayItem.BreakEndHour), currentDate)
            };
        });
    };

    const resetDateValue = (date: Date, item: Date): Date => {
        const cloned = new Date(date);
        return new Date(
            cloned.setFullYear(item.getFullYear(), item.getMonth(), item.getDate())
        );
    };

    const generateEvents = (activeData: Record<string, any>): Record<string, any>[] => {
        const filteredEvents: Record<string, any>[] = [];
        const datas: Record<string, any>[] = hospitalData.current.filter((item: any) =>
            item.DoctorId === activeData['Id'] || (Array.isArray(item.DoctorId) && item.DoctorId.indexOf(activeData['Id']) !== -1));
        datas.forEach((element: Record<string, any>) => filteredEvents.push(element));
        activeData['WorkDays'].forEach((element: Record<string, any>) => {
            if (element['State'] !== 'RemoveBreak') {
                const newBreakEvent: Record<string, any> = {
                    Id: Math.max.apply(Math, filteredEvents.map((data: Record<string, any>) => data['Id'])) + 1,
                    Name: 'Break Time',
                    StartTime: element['BreakStartHour'],
                    EndTime: element['BreakEndHour'],
                    IsBlock: true,
                    DoctorId: activeData['Id']
                };
                filteredEvents.push(newBreakEvent);
            }
            if (element['Enable']) {
                const shiftValue: string = activeData['DutyTiming'];
                const obj: Record<string, any>[] = [];
                if (shiftValue === 'Shift1') {
                    const shiftTiming = {
                        startTime: new Date(new Date(element['WorkStartHour']).setHours(17)),
                        endTime: new Date(new Date(element['WorkEndHour']).setHours(21))
                    };
                    obj.push(shiftTiming);
                } else if (shiftValue === 'Shift2') {
                    const shiftTiming1 = {
                        startTime: new Date(new Date(element['WorkStartHour']).setHours(8)),
                        endTime: new Date(new Date(element['WorkEndHour']).setHours(10))
                    };
                    const shiftTiming2 = {
                        startTime: new Date(new Date(element['WorkStartHour']).setHours(19)),
                        endTime: new Date(new Date(element['WorkEndHour']).setHours(21))
                    };
                    obj.push(shiftTiming1);
                    obj.push(shiftTiming2);
                } else {
                    const shiftTiming = {
                        startTime: new Date(new Date(element['WorkStartHour']).setHours(8)),
                        endTime: new Date(new Date(element['WorkEndHour']).setHours(12))
                    };
                    obj.push(shiftTiming);
                }
                obj.forEach(item => {
                    const newBreakEvent: Record<string, any> = {
                        Id: Math.max.apply(Math, filteredEvents.map((data: Record<string, any>) => data['Id'])) + 1,
                        Name: 'Off Work',
                        StartTime: item['startTime'],
                        EndTime: item['endTime'],
                        IsBlock: true,
                        DoctorId: activeData['Id']
                    };
                    filteredEvents.push(newBreakEvent);
                });
            }
        });
        return filteredEvents;
    }

    const setDefaultData = (): void => {
        scheduleObj.current.resources[0].dataSource = specialistCategory;
        scheduleObj.current.resources[1].dataSource = resourceDataSource;
        scheduleObj.current.resources[0].query = new Query();
        scheduleObj.current.resources[1].query = new Query();
        eventData.current = hospitalData.current;
        scheduleObj.current.eventSettings.dataSource = eventData.current;
        scheduleObj.current.refreshEvents();
        treeObj.current.updateActiveWaitingList();
        setWorkDays([0, 1, 2, 3, 4, 5, 6]);
        setWorkHours({ start: '08:00', end: '21:00' });
        activeDoctorData.current = [];
    }

    const quickInfoCloseClick = (): void => {
        if (scheduleObj.current) {
            scheduleObj.current.closeQuickInfoPopup();
        }
    }

    const dateHeaderTemplate = useCallback((props: Record<string, any>): JSX.Element => {
        return (
            <div className="date-text">{getDateHeaderText(props.date)}</div>
        );
    }, []);

    const header = useCallback((props: Record<string, any>): JSX.Element => {
        if (props.elementType === 'cell') {
            return (<></>)
        }
        return (
            <div>
                <div className="quick-info-header">
                    <div className="quick-info-header-icon-wrapper">
                        <Button className="e-flat e-round e-small" onClick={quickInfoCloseClick} />
                    </div>
                    <div className="quick-info-header-content" style={getBackGroundColor(props)}>
                        <div className="quick-info-title">Appointment Details</div>
                        <div className='duration-text'>{getEventDetails(props)}</div>
                    </div>
                </div>
            </div>
        );
    }, []);

    const content = useCallback((props: Record<string, any>): JSX.Element => {
        if (props.elementType === 'cell') {
            return (
                <div className="e-cell-content">
                    <form className="e-schedule-form">
                        <div style={{ padding: "10px" }}>
                            <input className="subject e-field" type="text" name="Subject" placeholder="Title" style={{ width: "100%" }} />
                        </div>
                        <div style={{ padding: "10px" }}>
                            <input className="location e-field" type="text" name="Location" placeholder="Location" style={{ width: "100%" }} />
                        </div>
                        <div style={{ padding: "10px" }}>
                            <Button className="e-small e-round" onClick={onAddPatient}>
                                <span className="e-icons e-add-icon"></span>
                            </Button>
                        </div>
                    </form>
                </div>
            );
        }
        return (
            <div>
                <div className="event-content">
                    <div className="patient-name-wrap">
                        <label>Patient Name</label>:
                        <div><span>{getPatientName(props)}</span></div>
                    </div>
                    <div className="doctor-name-wrap">
                        <label>{props.DoctorId ? "Doctor Name" : "Department Name"}</label>:
                        <div><span>{getDoctorName(props)}</span></div>
                    </div>
                    <div className="notes-wrap">
                        <label>Notes</label>:
                        <div><span>{props.Symptoms}</span></div>
                    </div>
                </div>
            </div>
        );
    }, []);

    const quickInfoTemplates = { header: header, content: content };

    const itemTemplate = (props: Record<string, any>): JSX.Element => {
        return (
            <div className="specialist-item">
                <img className="value" src={loadImage(props.Text)} alt="doctor" />
                <div className="doctor-details">
                    <div className="name">Dr.{props.Name}</div>
                    <div className="designation">{props.Designation}</div>
                </div>
            </div>
        );
    }

    const footerTemplate = (): JSX.Element => {
        return (
            <div className="add-doctor" onClick={onAddClick.bind(this)}>
                <div className="e-icon-add e-icons"></div>
                <div className="add-doctor-text">Add New Doctor</div>
            </div>
        );
    }

    const speciaListDialogHeader = (): JSX.Element => {
        return (
            <div className="specialist-header">
                <div>
                    <span className="back-icon icon-previous" onClick={onBackIconClick.bind(this)}></span>
                    <span className="title-text">CHOOSE SPECIALIST</span>
                </div>
                <div>
                    <Button className="e-small" >CLEAR</Button>
                </div>
            </div>
        );
    }

    const speciaListDialogFooter = (): JSX.Element => {
        return (
            <div className="add-doctor" onClick={onAddClick.bind(this)}>
                <div className="e-icon-add e-icons"></div>
                <div className="add-doctor-text">Add New Doctor</div>
            </div>
        );
    }

    return (
        <>
            <div className="planner-calendar">
                <div className="doctor-container" style={{ display: 'none' }}>
                    <div className="app-doctors"></div>
                    <div className="app-doctor-icon"></div>
                </div>
                <div className="drag-sample-wrapper droppable">
                    <div className="schedule-container">
                        <Scheduler 
                            height='800px' 
                            width='1000px'
                            className='doctor-appointment-planner'
                            showWeekend={false}
                            startHour={startHour} 
                            endHour={endHour} 
                            defaultSelectedDate={selectedDate}
                            timeScale={timeScale} 
                            workDays={workDays} 
                            workHours={workHours} 
                            defaultView={currentView}
                            firstDayOfWeek={0}
                            resources={[
                                {
                                    name: 'Departments',
                                    field: 'DepartmentId',
                                    title: 'Department',
                                    textField: 'Text',
                                    idField: 'DepartmentId',
                                    colorField: 'Color',
                                    dataSource: specialistCategory
                                },
                                {
                                    name: 'Doctors',
                                    field: 'DoctorId',
                                    title: 'Consultation',
                                    textField: 'Name',
                                    idField: 'Id',
                                    groupIDField: 'DepartmentId',
                                    colorField: 'Color',
                                    dataSource: resourceDataSource
                                }
                            ]}
                            eventSettings={{
                                ...eventSettings.current,
                                dataSource: schedulerEvents
                            }}
                            dateHeader={dateHeaderTemplate}
                        >
                            <DayView />
                            <WeekView />
                            <WorkWeekView />
                            <MonthView />
                        </Scheduler>
                    </div>
                    <div className="treeview-container">
                        <div className="choose-Specialist-container">
                                <DropDownList
                                    ref={dropdownObj}
                                    id='specialist'
                                    dataSource={doctorsData}
                                    fields={fields}
                                    placeholder='Choose Specialist'
                                    clearButton={true}
                                    onChange={onDoctorSelect.bind(this)}
                                    itemTemplate={itemTemplate.bind(this)}
                                    footerTemplate={footerTemplate()}
                                    popupSettings={{ width: '250px' }}
                                    className={"e-specialist-doctors" + (isDevice ? " e-specialist-hide" : "")}
                                />
                        </div>
                        <div className="add-event-container" style={{ display: 'none' }}>
                            <Button onClick={createNewEvent.bind(this)} className="e-primary">Add Appointment</Button>
                        </div>
                        <div className="title-container">
                            <h2 className="title-text">Waiting List</h2>
                        </div>
                        <Toast ref={toastObj} position={position} width={toastWidth} height='70px' closeButton={true}>
                        </Toast>
                        <TreeWaitingList ref={treeObj} getCalendarData={getCalendarData} setTreeItemDrop={setTreeItemDrop} />
                    </div>
                </div >
            </div >
            <div className="specialist-dialog" style={{ display: 'none' }}>
                <Dialog
                    ref={specialistObj}
                    open={isOpen}
                    style={{ height: '500px', width: '100%' }}
                    className='specialist-selection'
                    modal={true}
                    closeIcon={false}
                    target={document.getElementById('content-area') ?? undefined}
                    header={speciaListDialogHeader()}
                    footer={speciaListDialogFooter()}
                >
                    <div>
                        {
                            specialistData && specialistData.map((specialist: Record<string, any>, index: number) => {
                                return (
                                    <div key={index}>
                                        <div className="specialist-item" data-deptid={specialist['DepartmentId']} data-doctorid={specialist['Id']}
                                            onClick={onSpecialistSelect.bind(this)}>
                                            <img className="value" src={loadImage(specialist['Text'])} alt="doctor" />
                                            <div className="doctor-details">
                                                <div className="name">Dr.{specialist['Name']}</div>
                                                <div className="designation">{specialist['Designation']}</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </Dialog>
            </div>
            <div className="waiting-list-container" style={{ display: 'none' }}>
                <DialogWaitingList ref={waitingObj} getCalendarData={getCalendarData} updateEventData={updateEventData} />
            </div>
            <AddEditDoctor ref={addEditDoctorObj} calendarDropDownObj={dropdownObj} />
            <AddEditPatient ref={addEditPatientObj} calendarComboBoxObj={comboBox} />
        </>
    )
}

export default memo(Calendar);
