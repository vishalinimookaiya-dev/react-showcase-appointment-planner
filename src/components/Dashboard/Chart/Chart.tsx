import * as React from 'react';
import { useMemo } from 'react';
import {
    Chart,
    ChartPrimaryXAxis,
    ChartPrimaryYAxis,
    ChartSeriesCollection,
    ChartSeries
} from '@syncfusion/react-charts';

interface ChartProps {
    currentViewEvents: Record<string, any>[];
    firstDayOfWeek: Date;
}

interface ChartPoint {
    Date: Date;
    EventCount: number;
}

interface ChartData {
    diabetology: ChartPoint[];
    orthopaedics: ChartPoint[];
    cardiology: ChartPoint[];
}

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date.getTime());
    result.setDate(result.getDate() + days);
    return result;
};

const resetTime = (date: Date): Date => {
    const result = new Date(date.getTime());
    result.setHours(0, 0, 0, 0);
    return result;
};

export const ConsultationChart = ({
    currentViewEvents,
    firstDayOfWeek
}: ChartProps) => {
    const chartArea = {
        border: { width: 0 }
    };

    const titleStyle = {
        textAlignment: 'Near'
    };

    const legendSettings = {
        visible: true,
        position: 'Top',
        padding: 20
    };

    const chartData: ChartData = useMemo(() => {
        const diabetologyData = currentViewEvents.filter(
            (item) => item['DepartmentId'] === 5
        );

        const orthopaedicsData = currentViewEvents.filter(
            (item) => item['DepartmentId'] === 4
        );

        const cardiologyData = currentViewEvents.filter(
            (item) => item['DepartmentId'] === 6
        );

        const getChartData = (
            data: Record<string, any>[],
            startDate: Date
        ): ChartPoint => {
            const currentDate = resetTime(startDate).getTime();

            const filteredData = data.filter((item) => {
                const eventDate = resetTime(new Date(item['StartTime'])).getTime();
                return currentDate === eventDate;
            });

            return {
                Date: new Date(startDate.getTime()),
                EventCount: filteredData.length
            };
        };

        const result: ChartData = {
            diabetology: [],
            orthopaedics: [],
            cardiology: []
        };

        let date = new Date(firstDayOfWeek.getTime());

        for (let i = 0; i < 7; i++) {
            result.diabetology.push(getChartData(diabetologyData, date));
            result.orthopaedics.push(getChartData(orthopaedicsData, date));
            result.cardiology.push(getChartData(cardiologyData, date));

            date = addDays(date, 1);
        }

        return result;
    }, [currentViewEvents, firstDayOfWeek]);
    return (
    <Chart id="chartcontainer" height="340px">
        <ChartPrimaryXAxis
            valueType="DateTime"
            interval={1}
            intervalType="Days"
            
            minimum={firstDayOfWeek}
            maximum={addDays(firstDayOfWeek, 6)}

        />

        <ChartPrimaryYAxis
            minimum={0}
            maximum={6}
            interval={2}
        />

        <ChartSeriesCollection>
            <ChartSeries
                dataSource={chartData.diabetology}
                type="Spline"
                width={2}
                xField="Date"
                yField="EventCount"
                name="Diabetology"
                legendShape="Circle"
                fill="#60F238"
            />
            <ChartSeries
                dataSource={chartData.orthopaedics}
                type="Spline"
                width={2}
                xField="Date"
                yField="EventCount"
                name="Orthopaedics"
                legendShape="Circle"
                fill="#388CF5"
            />
            <ChartSeries
                dataSource={chartData.cardiology}
                type="Spline"
                width={2}
                xField="Date"
                yField="EventCount"
                name="Cardiology"
                legendShape="Circle"
                fill="#F29438"
            />
        </ChartSeriesCollection>
    </Chart>
);
};