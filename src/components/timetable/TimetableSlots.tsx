import {TimetableSlot} from 'open-polito-api/timetable';
import React, {useEffect, useMemo, useState} from 'react';
import {Dimensions, View} from 'react-native';
import TimetableDay from './TimetableDay';
import {Configuration} from '../../defaultConfig';
import {useDispatch, useSelector} from 'react-redux';
import {setConfig} from '../../store/sessionSlice';
import {AppDispatch, RootState} from '../../store/store';
import {p} from '../../scaling';

const TimetableSlots = ({
  loaded,
  timetableDays,
  layout,
  selectedDay,
}: {
  loaded: boolean;
  timetableDays: TimetableSlot[][];
  layout: 'week' | 'day';
  selectedDay: number;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector<RootState, Configuration>(
    state => state.session.config,
  );

  const [h, setH] = useState(Dimensions.get('window').height / 15);

  const [courseNames, setCourseNames] = useState<string[]>(['', '', '']);

  const days = useMemo<TimetableSlot[][]>(() => {
    if (timetableDays.length === 1) return timetableDays;
    return timetableDays.slice(1, 6);
  }, [timetableDays]);

  const getCourseNames = (): string[] => {
    let _courseNames: string[] = [];
    timetableDays.forEach(day => {
      day.forEach(slot => {
        if (!_courseNames.includes(slot.course_name)) {
          _courseNames.push(slot.course_name);
        }
      });
    });
    return _courseNames.sort();
  };

  useEffect(() => {
    setCourseNames(getCourseNames());
  }, [days]);

  /**
   * When course names or slots change, if priority enabled, update the priority list
   */
  useEffect(() => {
    if (!config.timetableOverlap || !config.timetablePriority) return;
    let _list: string[] = [...config.timetablePriority];
    courseNames.forEach(courseName => {
      if (!config.timetablePriority.includes(courseName)) {
        _list.push(courseName);
      }
    });
    dispatch(setConfig({...config, timetablePriority: _list}));
  }, [days, courseNames]);

  return (
    <View
      style={{
        position: 'absolute',
        flex: 1,
        marginLeft: 32 * p,
        marginRight: 16 * p,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}>
      {(layout === 'week' ? days : [days[selectedDay - 1]]).map(
        (day, index) => (
          <TimetableDay
            fake={!loaded}
            config={config}
            key={index}
            {...{day, h, index, courseNames}}
          />
        ),
      )}
    </View>
  );
};

export default TimetableSlots;
