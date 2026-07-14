import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Color, Variant } from '@syncfusion/react-buttons';
import { DropDownList } from '@syncfusion/react-dropdowns';
import { Tooltip } from '@syncfusion/react-popups';
import { AddEditDoctor } from '../AddEditDoctor/AddEditDoctor';
import { useData, useDataDispatch } from '../../context/DataContext';
import { updateActiveItem, loadImage } from '../../util';
import './Doctors.scss';

export const Doctors = () => {
  const dataService = useData();
  const dispatch = useDataDispatch();
  const addEditDoctorObj = useRef(null);
  const navigate = useNavigate();

  const doctorsData: Record<string, any>[] = dataService.doctorsData;
  const [filteredDoctors, setFilteredDoctors] = useState(dataService.doctorsData);
  const specializationData: Record<string, any>[] = dataService.specialistData;
  const fields: Record<string, any> = { text: 'Text', value: 'Id' };
  let selectedDepartmentId: string;

  useEffect(() => {
    updateActiveItem('doctors');
  }, []);

  const getColor = (args: Record<string, string>): string => args['Color'];

  const onSpecializationChange = (args?: Record<string, any>): void => {
    let filteredData: Record<string, any>[];
    if (args && args['value']) {
      selectedDepartmentId = args['itemData'].DepartmentId;
      filteredData = doctorsData.filter((item: any) => item.DepartmentId === selectedDepartmentId);
    } else {
      selectedDepartmentId = null;
      filteredData = doctorsData;
    }
    setFilteredDoctors(filteredData);
  };

  const onSpecialistClick = (args: Record<string, any>): void => {
    const specialistId: string = args['currentTarget'].querySelector('.specialist-item').id.split('_')[1];
    const filteredData: Record<string, any>[] = doctorsData.filter((item: any) => item.Id === parseInt(specialistId, 10));
    dispatch({ type: 'SET_ACTIVE_DOCTOR', data: filteredData[0] });
    navigate('/doctor-details/' + specialistId);
  };

  const onAddDoctor = (): void => {
    addEditDoctorObj.current.onAddDoctor();
  };

  const updateDoctors = (): void => {
    if (selectedDepartmentId) {
      setFilteredDoctors(doctorsData.filter((item: any) => item.DepartmentId === selectedDepartmentId));
    } else {
      setFilteredDoctors(doctorsData);
    }
  };

  const getEducation = (text: string): string => text.toUpperCase();

  const itemTemplate = (props: Record<string, any>): JSX.Element => (
    <div className="specialist-value">
      <span className={props.Id} style={{ background: getColor(props) }}></span>
      <span className="name">{props.Text}</span>
    </div>
  );

  const valueTemplate = (props: Record<string, any>): JSX.Element => (
    <div className="specialist-value department-value">
      <span className={props.Id} style={{ background: getColor(props) }}></span>
      <span className="name">{props.Text}</span>
    </div>
  );

  const tooltipContent = (availability: string): JSX.Element => <>{availability}</>;

  return (
    <>
      <div className="doctors-wrapper">
        <header>
          <div className="module-title">
            <div className="title">DOCTORS LIST</div>
            <div className="underline"></div>
          </div>
          <div className="add-doctor" onClick={onAddDoctor}>
            <div className="e-icon-add e-icons"></div>
            <div className="add-doctor-label">Add New</div>
          </div>
        </header>

        <div className="specialization-detail-wrapper">
          <div className="specialization-types">
            <DropDownList
              id="Specialization"
              className="specialization-ddl"
              dataSource={specializationData}
              clearButton={true}
              onChange={onSpecializationChange}
              fields={fields}
              placeholder="Select a Specialization"
              popupSettings={{ width: '100%', height: '230px' }}
              variant={Variant.Outlined}
              itemTemplate={itemTemplate}
              valueTemplate={valueTemplate}
            />
            <Button onClick={onAddDoctor} color={Color.Primary}>Add New Doctor</Button>
          </div>

          <div className="specialist-display">
            {filteredDoctors && filteredDoctors.map((data: Record<string, any>, index: number) => (
              <Tooltip
                key={index}
                content={tooltipContent(data['Availability'])}
                position="RightTop"
                className="availability-tooltip"
              >
                <div onClick={onSpecialistClick}>
                  <div className="e-cards specialist-item" id={"Specialist_" + data['Id']}>
                    <div className="e-card-content">
                      <div className="specialist-image">
                        <img className="profile" src={loadImage(data['Text'])} alt="doctor" />
                        <span className={"availability " + data['Availability']}></span>
                        <span className={"upload icon-upload_photo " + data['NewDoctorClass']}></span>
                      </div>
                    </div>
                    <div className="specialist-detail">
                      <div className="name">Dr. {data['Name']}</div>
                      <div className="education">{getEducation(data['Education'])}</div>
                      <div className="specialist-experience">
                        <div className="specialization">
                          <span className="label-text">Designation</span>
                          <span className="specialization-text">{data['Designation']}</span>
                        </div>
                        <div className="experience">
                          <span className="label-text">Experience</span>
                          <span className="specialization-text">{data['Experience']}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      <AddEditDoctor ref={addEditDoctorObj} refreshDoctors={updateDoctors} />
    </>
  );
};