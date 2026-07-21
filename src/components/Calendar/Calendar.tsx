import * as React from 'react';
import { useRef, useEffect, useCallback, memo, useState } from 'react';
import {
    closest, Browser, extend, isNullOrUndefined
} from '@syncfusion/react-base';
import { Internationalization } from '@syncfusion/ej2-base';
import { Query } from '@syncfusion/react-data';
import { Toast } from '@syncfusion/react-notifications';
import { Button, Color, Variant } from '@syncfusion/react-buttons';
import { Dialog } from '@syncfusion/react-popups';
import {
    Scheduler, DayView, WeekView, WorkWeekView, MonthView
} from '@syncfusion/react-scheduler';
import { DropDownList } from '@syncfusion/react-dropdowns';
import { AddEditDoctor } from '../AddEditDoctor/AddEditDoctor';
import { AddEditPatient } from '../AddEditPatient/AddEditPatient';
import { TreeWaitingList } from './TreeWaitingList/TreeWaitingList';
import { DialogWaitingList } from './DialogWaitingList/DialogWaitingList';
import { CalendarSettings } from '../../models/calendar-settings';
import { CalendarData } from '../../models/calendar-data';
import { useData, useDataDispatch } from '../../context/DataContext';
import { useActivityDispatch } from '../../context/ActivityContext';
import {  updateActiveItem, loadImage, getString } from '../../util';
import './Calendar.scss';
import { CloseIcon } from "@syncfusion/react-icons"

const Calendar = () => {
    const dataService = useData();
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
    let maxAppointmentID: number = hospitalData.current.length > 0
        ? hospitalData.current[hospitalData.current.length - 1]['Id']
        : 1028 as number;
    const calendarSettings: CalendarSettings = dataService.calendarSettings;

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
    const [schedulerEvents, setSchedulerEvents] = useState<Record<string, any>[]>(
        dataService.hospitalData
    );
    const currentDate = useRef(selectedDate);
    const toastWidth = isDevice ? '300px' : '580px';

    useEffect(() => {
        updateActiveItem('calendar');
        setIsOpen(false);
    }, []);

    const onAddPatient = (): void => {
        addEditPatientObj.current.onAddPatient();
    };

    const getPatientName = (data: Record<string, any>): string => {
        const patient = patientsData.find(
            (item: Record<string, any>) => item['Id'] === data?.PatientId
        );
        return patient?.Name?.toString() || '—';
    };

    const getDoctorName = (data: Record<string, any>): string => {
        if (!data) return '—';
        if (!isNullOrUndefined(data['DoctorId'])) {
            const doctor = doctorsData.find(
                (item: Record<string, any>) => item['Id'] === data['DoctorId']
            );
            return doctor ? `Dr. ${doctor.Name?.toString() || '—'}` : 'Dr. —';
        }
        const department = specialistCategory.find(
            (item: Record<string, any>) => item['DepartmentId'] === data['DepartmentId']
        );
        return department?.Text?.toString() || '—';
    };

    const getEventDetails = (data: Record<string, any>): string => {
        if (!data) return '—';
        const start = data.StartTime ?? data.startTime;
        const end = data.EndTime ?? data.endTime;
        if (!start || !end) return '—';

        const startDate = start instanceof Date ? start : new Date(start);
        const endDate = end instanceof Date ? end : new Date(end);

        return (
            instance.formatDate(startDate, { type: 'date', skeleton: 'long' }) +
            `(${getString(startDate, 'hm', instance)}-${getString(endDate, 'hm', instance)})`
        );
    };

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
        const filteredItems: Record<string, any>[] = doctorsData.filter(
            item => parseInt(doctorId, 10) === item['Id']
        );
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
            setWorkHours({
                start: selectedDoctorData['StartHour'],
                end: selectedDoctorData['EndHour']
            });
        } else {
            eventData.current = hospitalData.current;
            setSchedulerEvents(hospitalData.current);
            setWorkDays([0, 1, 2, 3, 4, 5, 6]);
            setWorkHours({ start: '08:00', end: '21:00' });
        }

        if (treeObj.current) {
            treeObj.current.updateWaitingList(parseInt(deptId, 10), parseInt(doctorId, 10), null);
        }
    };

    const onAddClick = (): void => {
        addEditDoctorObj.current.onAddDoctor();
    };

    const createNewEvent = (e: MouseEvent): void => {
        const args = e as Record<string, any> & MouseEvent;
        let data: Record<string, any>;
        const isSameTime: boolean =
            scheduleObj.current.activeCellsData.startTime.getTime() ===
            scheduleObj.current.activeCellsData.endTime.getTime();
        if (scheduleObj.current.activeCellsData && !isSameTime) {
            data = scheduleObj.current.activeCellsData;
        } else {
            const interval: number = scheduleObj.current.activeViewOptions.timeScale.interval;
            const slotCount: number = scheduleObj.current.activeViewOptions.timeScale.slotCount;
            const msInterval: number = (interval * 60000) / slotCount;
            const startTime: Date = new Date(scheduleObj.current.selectedDate.getTime());
            startTime.setHours(
                new Date().getHours(),
                Math.round(startTime.getMinutes() / msInterval) * msInterval,
                0
            );
            const endTime: Date = new Date(
                new Date(startTime.getTime()).setMilliseconds(
                    startTime.getMilliseconds() + msInterval
                )
            );
            data = { startTime, endTime, isAllDay: false };
        }
        scheduleObj.current.openEditor(
            extend(data, { cancel: false, event: args.event }),
            'Add'
        );
    };

    const onSpecialistSelect = (args: Record<string, any>): void => {
        const target: HTMLElement = closest(args['target'], '.specialist-item') as HTMLElement;
        const deptId: string = target.getAttribute('data-deptid');
        const doctorId: string = target.getAttribute('data-doctorid');
        refreshDataSource(deptId, doctorId);

        const doctorImage: HTMLElement = scheduleObj.current.element.querySelector(
            '.doctor-icon .active-doctor'
        );
        doctorImage.setAttribute('src', loadImage(activeDoctorData.current[0]['Text']));

        setIsOpen(false);
    };

    const onBackIconClick = (): void => {
        setIsOpen(false);
    };

    const getCalendarData = (): CalendarData => {
        return {
            scheduleObj: scheduleObj.current,
            toastObj: toastObj.current,
            treeObj: treeObj.current,
            currentDate: currentDate.current,
            activeDoctorData: activeDoctorData.current
        };
    };

    const updateEventData = (data: Record<string, any>[]): void => {
        eventData.current = data;
        setSchedulerEvents(data);
    };

    const setTreeItemDrop = (): void => {
        isTreeItemDropped.current = true;
    };

    const getDateHeaderText: Function = (value: Date): string =>
        instance.formatDate(value, { skeleton: 'MMMEd' }).toUpperCase();

    const getBackGroundColor = (data: Record<string, any>): Record<string, string> => {
        let color = '#7575ff';
        if (calendarSettings.bookingColor === 'Doctors' && !isNullOrUndefined(data['DoctorId'])) {
            const doctor = doctorsData.find(
                (item: Record<string, any>) => item['Id'] === data['DoctorId']
            );
            color = doctor?.Color || color;
        } else if (!isNullOrUndefined(data['DepartmentId'])) {
            const department = specialistCategory.find(
                (item: Record<string, any>) => item['DepartmentId'] === data['DepartmentId']
            );
            color = department?.Color || color;
        }
        return { backgroundColor: color, color: '#FFFFFF' };
    };

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
        const datas: Record<string, any>[] = hospitalData.current.filter(
            (item: any) =>
                item.DoctorId === activeData['Id'] ||
                (Array.isArray(item.DoctorId) && item.DoctorId.indexOf(activeData['Id']) !== -1)
        );
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
                    obj.push({
                        startTime: new Date(new Date(element['WorkStartHour']).setHours(17)),
                        endTime: new Date(new Date(element['WorkEndHour']).setHours(21))
                    });
                } else if (shiftValue === 'Shift2') {
                    obj.push({
                        startTime: new Date(new Date(element['WorkStartHour']).setHours(8)),
                        endTime: new Date(new Date(element['WorkEndHour']).setHours(10))
                    });
                    obj.push({
                        startTime: new Date(new Date(element['WorkStartHour']).setHours(19)),
                        endTime: new Date(new Date(element['WorkEndHour']).setHours(21))
                    });
                } else {
                    obj.push({
                        startTime: new Date(new Date(element['WorkStartHour']).setHours(8)),
                        endTime: new Date(new Date(element['WorkEndHour']).setHours(12))
                    });
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
    };

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
    };

    const quickInfoCloseClick = (
        e: React.MouseEvent<HTMLButtonElement>
    ): void => {
        e.preventDefault();
        e.stopPropagation();
        scheduleObj.current?.closeQuickInfoPopup();
    };

    const dateHeaderTemplate = useCallback((props: Record<string, any>): JSX.Element => {
        return <div className="date-text">{getDateHeaderText(props.date)}</div>;
    }, []);

    const getEventFromProps = (props: any): Record<string, any> => {
        if (!props) return {};
        return (
            props.eventData ||
            props.data ||
            props.event ||
            props
        );
    };

    const editHeader = useCallback((props: any): JSX.Element => {
        const eventData = getEventFromProps(props);
        return (
            <>
                <div className="quick-info-header-icon-wrapper">
                    <Button
                        className="close-icon"
                        onClick={quickInfoCloseClick}
                        type="button"
                        icon={<CloseIcon/>}
                        variant={Variant.Outlined}
                        color={Color.Secondary}
                    >
                    </Button>
                </div>
                <div className="quick-info-header">
                    <div
                        className="quick-info-header-content"
                        style={getBackGroundColor(eventData)}
                    >
                        <div className="quick-info-title">Appointment Details</div>
                        <div className="duration-text">{getEventDetails(eventData)}</div>
                    </div>
                </div>
            </>
        );
    }, []);

    const editContent = useCallback((props: any): JSX.Element => {
        if (props?.elementType === 'cell') {
            return (
                <div className="e-cell-content">
                    <form className="e-schedule-form">
                        <div style={{ padding: '10px' }}>
                            <input
                                className="subject e-field"
                                type="text"
                                name="Subject"
                                placeholder="Title"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ padding: '10px' }}>
                            <input
                                className="location e-field"
                                type="text"
                                name="Location"
                                placeholder="Location"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ padding: '10px' }}>
                            <Button className="e-small e-round" onClick={onAddPatient}>
                                <span className="e-icons e-add-icon"></span>
                            </Button>
                        </div>
                    </form>
                </div>
            );
        }

        const eventData = getEventFromProps(props);
        return (
            <div className="event-content">
                <div className="patient-name-wrap">
                    <label>Patient Name</label>:
                    <div><span>{getPatientName(eventData)}</span></div>
                </div>
                <div className="doctor-name-wrap">
                    <label>{eventData.DoctorId ? 'Doctor Name' : 'Department Name'}</label>:
                    <div><span>{getDoctorName(eventData)}</span></div>
                </div>
                <div className="notes-wrap">
                    <label>Notes</label>:
                    <div><span>{eventData.Symptoms || '—'}</span></div>
                </div>
            </div>
        );
    }, []);

    const editFooter = useCallback((props: any): JSX.Element => {
        const schedulerEvent = getEventFromProps(props);

        const onEditClick = (e: React.MouseEvent): void => {
            e.preventDefault();
            e.stopPropagation();

            scheduleObj.current?.closeQuickInfoPopup();

            setTimeout(() => {
                scheduleObj.current.openEditor('Edit', schedulerEvent)
            }, 100);
        };

        const onDeleteClick = (e: React.MouseEvent): void => {
            e.preventDefault();
            e.stopPropagation();

            scheduleObj.current?.closeQuickInfoPopup();

            setTimeout(() => {
                scheduleObj.current?.deleteEvent(schedulerEvent);
            }, 100);
        };

        return (
            <div className="quick-info-footer">
                <Button onClick={onEditClick} type="button">Edit</Button>
                <Button onClick={onDeleteClick} type="button" variant={Variant.Outlined} color={Color.Secondary}>Delete</Button>
            </div>
        );
    }, []);

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
    };

    const footerTemplate = (): JSX.Element => {
        return (
            <div className="add-doctor" onClick={onAddClick.bind(this)}>
                <div className="e-icon-add e-icons"></div>
                <div className="add-doctor-text">Add New Doctor</div>
            </div>
        );
    };

    const speciaListDialogHeader = (): JSX.Element => {
        return (
            <div className="specialist-header">
                <div>
                    <span
                        className="back-icon icon-previous"
                        onClick={onBackIconClick.bind(this)}
                    ></span>
                    <span className="title-text">CHOOSE SPECIALIST</span>
                </div>
                <div>
                    <Button className="e-small">CLEAR</Button>
                </div>
            </div>
        );
    };

    const speciaListDialogFooter = (): JSX.Element => {
        return (
            <div className="add-doctor" onClick={onAddClick.bind(this)}>
                <div className="e-icon-add e-icons"></div>
                <div className="add-doctor-text">Add New Doctor</div>
            </div>
        );
    };

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
                            ref={scheduleObj}
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
                            quickInfo={{
                                editHeader: editHeader,
                                editContent: editContent,
                                editFooter: editFooter
                            }}
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
                                variant={Variant.Outlined}
                            />
                        </div>
                        <div className="add-event-container" style={{ display: 'none' }}>
                            <Button
                                onClick={createNewEvent.bind(this)}
                                className="e-primary"
                            >
                                Add Appointment
                            </Button>
                        </div>
                        <div className="title-container">
                            <h2 className="title-text">Waiting List</h2>
                        </div>
                        <Toast
                            ref={toastObj}
                            position={position}
                            width={toastWidth}
                            height='70px'
                            closeButton={true}
                        />
                        <TreeWaitingList
                            ref={treeObj}
                            getCalendarData={getCalendarData}
                            setTreeItemDrop={setTreeItemDrop}
                        />
                    </div>
                </div>
            </div>

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
                        {specialistData && specialistData.map((specialist: Record<string, any>, index: number) => {
                            return (
                                <div key={index}>
                                    <div
                                        className="specialist-item"
                                        data-deptid={specialist['DepartmentId']}
                                        data-doctorid={specialist['Id']}
                                        onClick={onSpecialistSelect.bind(this)}
                                    >
                                        <img
                                            className="value"
                                            src={loadImage(specialist['Text'])}
                                            alt="doctor"
                                        />
                                        <div className="doctor-details">
                                            <div className="name">Dr.{specialist['Name']}</div>
                                            <div className="designation">{specialist['Designation']}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Dialog>
            </div>

            <div className="waiting-list-container" style={{ display: 'none' }}>
                <DialogWaitingList
                    ref={waitingObj}
                    getCalendarData={getCalendarData}
                    updateEventData={updateEventData}
                />
            </div>

            <AddEditDoctor ref={addEditDoctorObj} calendarDropDownObj={dropdownObj} />
            <AddEditPatient ref={addEditPatientObj} calendarComboBoxObj={comboBox} />
        </>
    );
};

export default memo(Calendar);