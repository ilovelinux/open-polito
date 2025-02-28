import React, {useContext, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Modal, TouchableOpacity, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useDispatch, useSelector} from 'react-redux';
import colors from '../../colors';
import {DeviceContext} from '../../context/Device';
import {p} from '../../scaling';
import {setDialog} from '../../store/sessionSlice';
import {AppDispatch, RootState} from '../../store/store';
import {DialogParams} from '../../types';
import Text from '../../ui/core/Text';
import ExamsBookExamDialog from './ExamsBookExamDialog';
import ExamsCancelExamDialog from './ExamsCancelExamDialog';
import ListSelectorDialog from './ListSelectorDialog';
import SettingsEnableLoggingDialog from './SettingsEnableLoggingDialog';
import TimetableEventDialog from './TimetableEventDialog';
import TimetableOptionsDialog from './TimetableOptionsDialog';

const Dialog = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {t} = useTranslation();
  const {dark} = useContext(DeviceContext);

  const close = () => {
    dispatch(setDialog({visible: false, params: null}));
  };

  const dialog = useSelector<
    RootState,
    {visible: boolean; params: DialogParams | null}
  >(state => state.session.dialog);

  const [title, setTitle] = useState('');

  const [fixedHeight, setFixedHeight] = useState(false);

  const dialogComponent = useMemo(() => {
    switch (dialog.params?.type) {
      case 'LIST_SELECTOR':
        setTitle(dialog.params?.title || '');
        setFixedHeight(false);
        return <ListSelectorDialog {...dialog.params} />;
      case 'TIMETABLE_OPTIONS':
        setTitle(t('timetableOptions'));
        setFixedHeight(false);
        return <TimetableOptionsDialog {...dialog.params} />;
      case 'TIMETABLE_EVENT':
        setTitle(dialog.params.slot.course_name);
        setFixedHeight(false);
        return <TimetableEventDialog {...dialog.params} />;
      case 'SETTINGS_ENABLE_LOGGING':
        setTitle('');
        setFixedHeight(false);
        return <SettingsEnableLoggingDialog />;
      case 'EXAMS_BOOK_EXAM':
        setTitle('');
        setFixedHeight(false);
        return <ExamsBookExamDialog {...dialog.params} />;
      case 'EXAMS_CANCEL_EXAM':
        setTitle('');
        setFixedHeight(false);
        return <ExamsCancelExamDialog {...dialog.params} />;
    }
  }, [dialog]);

  const offset = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: `rgba(0, 0, 0, ${offset.value})`,
    };
  });

  useEffect(() => {
    dialog.visible
      ? (offset.value = withTiming(0.5, {duration: 250}))
      : (offset.value = withTiming(0, {duration: 250}));
  }, [dialog.visible]);

  return (
    <Animated.View
      style={[
        animStyle,
        {
          height: '100%',
          width: '100%',
          position: 'absolute',
          display: dialog.visible ? 'flex' : 'none',
        },
      ]}>
      {dialog.visible ? (
        <Modal
          transparent={true}
          visible={dialog.visible}
          animationType="fade"
          statusBarTranslucent={true}
          onRequestClose={close}>
          <View
            style={{
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
            }}>
            <TouchableOpacity onPress={close} style={{flex: 1}} />
            <View
              style={{
                maxHeight: '80%',
                flex: fixedHeight ? 1 : 0,
                backgroundColor: dark ? colors.gray700 : colors.gray200,
                borderRadius: 4 * p,
                paddingVertical: 16 * p,
              }}>
              {title ? (
                <View style={{marginBottom: 24 * p, paddingHorizontal: 16 * p}}>
                  <Text s={16} w="m" c={dark ? colors.gray100 : colors.gray800}>
                    {title}
                  </Text>
                </View>
              ) : null}
              {dialogComponent}
            </View>
            <TouchableOpacity onPress={close} style={{flex: 1}} />
          </View>
        </Modal>
      ) : null}
    </Animated.View>
  );
};

export default Dialog;
