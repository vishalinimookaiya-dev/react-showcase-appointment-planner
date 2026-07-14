import * as React from 'react';
import { useEffect } from 'react';
import { DropDownList, Variant } from '@syncfusion/react-dropdowns';
import { CalendarSettings } from '../../models/calendar-settings';
import {
  timeSlots as scheduleSlots, startHours as scheduleStartHours, endHours as scheduleEndHours,
  views as scheduleViews, colorCategory as scheduleColorCategory, dayOfWeekList
} from '../../datasource';
import { useData, useDataDispatch } from '../../context/DataContext';
import { updateActiveItem } from '../../util';
import { Browser } from '@syncfusion/react-base';
import './Preference.scss';

export const Preference = () => {
  const dataService = useData();
  const dispatch = useDataDispatch();
  let timeSlots: Record<string, any>[] = scheduleSlots;
  let startHours: Record<string, any>[] = scheduleStartHours;
  let endHours: Record<string, any>[] = scheduleEndHours;
  let views: Record<string, any>[] = scheduleViews;
  let colorCategory: Record<string, any>[] = scheduleColorCategory;
  let dayOfWeeks: Record<string, any>[] = dayOfWeekList;
  let fields: Record<string, any> = { text: 'Text', value: 'Value' };
  let calendarSettings: CalendarSettings = dataService.calendarSettings;
  let width = Browser.isDevice ? '100%' : '335px';

  useEffect(() => {
    updateActiveItem('preference');
  }, []);

  return (
    <div className='preference-container'>
      <header>
        <div className="module-title">
          <div className='title'>PREFERENCE</div>
          <div className='underline'></div>
        </div>
      </header>

      <div className="control-container">
        <div className='label-text'>Default View</div>
        <DropDownList
          className="preference-drop-down"
          id="CurrentView"
          width={width}
          dataSource={views}
          fields={fields}
          variant={Variant.Outlined}
          value={views[1].Value}
        />
      </div>

      <div className="control-container">
        <div className='label-text'>Calendar Start Time</div>
        <DropDownList
          className='preference-drop-down'
          id='CalendarStart'
          width={width}
          dataSource={startHours}
          fields={fields}
          variant={Variant.Outlined}
          value={startHours[0].Value}
        />
      </div>

      <div className="control-container">
        <div className='label-text'>Calendar End Time</div>
        <DropDownList
          className='preference-drop-down'
          id='CalendarEnd'
          width={width}
          dataSource={endHours}
          fields={fields}
          variant={Variant.Outlined}
          value={endHours[0].Value}
        />
      </div>

      <div className="control-container">
        <div className='label-text'>Slot Duration</div>
        <DropDownList
          className='preference-drop-down'
          id='Duration'
          width={width}
          dataSource={timeSlots}
          fields={fields}
          variant={Variant.Outlined}
          value={timeSlots[2].Value}
        />
      </div>

      <div className="control-container">
        <div className='label-text'>Booking Color</div>
        <DropDownList
          className='preference-drop-down'
          id='BookingColor'
          width={width}
          dataSource={colorCategory}
          fields={fields}
          variant={Variant.Outlined}
          value={colorCategory[0].Value}
        />
      </div>

      <div className="control-container">
        <div className='label-text'>First Day of the Week</div>
        <DropDownList
          className='preference-drop-down'
          id='FirstDayOfWeek'
          width={width}
          dataSource={dayOfWeeks}
          fields={fields}
          variant={Variant.Outlined}
          value={dayOfWeeks[0].Value}
        />
      </div>
    </div>
  );
};