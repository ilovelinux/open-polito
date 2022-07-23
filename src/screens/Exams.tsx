import {useNavigation} from '@react-navigation/native';
import {
  CoursesInfo,
  PermanentMark,
  ProvisionalMark,
} from 'open-polito-api/courses';
import React, {useContext, useMemo, useState} from 'react';
import {useTranslation, withTranslation} from 'react-i18next';
import {FlatList, Linking, View} from 'react-native';
import {useSelector} from 'react-redux';
import colors from '../colors';
import {RootState} from '../store/store';
import {CoursesState} from '../store/coursesSlice';
import Screen from '../ui/Screen';
import Header, {HEADER_TYPE} from '../ui/Header';
import Tabs from '../ui/Tabs';
import {DeviceContext} from '../context/Device';
import {ScrollView, TouchableOpacity} from 'react-native-gesture-handler';
import {p} from '../scaling';
import Text from '../ui/core/Text';
import Section from '../ui/Section';
import NoContent from '../components/NoContent';
import TablerIcon from '../ui/core/TablerIcon';
import moment from 'moment';
import i18next from 'i18next';
import Svg, {Circle, Text as SvgText} from 'react-native-svg';

const tabs = ['overview', 'permanentMarks', 'provisionalMarks'];

const Exams = () => {
  const {t} = useTranslation();
  const {dark} = useContext(DeviceContext);

  const {marks} = useSelector<RootState, CoursesState>(state => state.courses);

  const [tab, setTab] = useState<string>(tabs[0]);

  const filteredMarks = useMemo<(PermanentMark | ProvisionalMark)[]>(() => {
    if (tab == tabs[1]) return marks.permanent;
    if (tab == tabs[2]) return marks.provisional;
    return [];
  }, [marks, tab]);

  const avg = useMemo(() => {
    console.log(marks);
    const _marks = [...marks.permanent, ...marks.provisional].filter(
      mark => !!parseInt(mark.mark || ''),
    );
    return (
      _marks.reduce((acc, mark) => {
        return acc + parseInt(mark.mark!);
      }, 0) / _marks.length
    );
  }, [marks, tab]);

  return (
    <Screen>
      <Header title={t('exams')} headerType={HEADER_TYPE.MAIN} />
      <Tabs
        dark={dark}
        adjusted
        items={tabs.map(tab => ({label: t(tab), value: tab}))}
        onChange={idx => setTab(tabs[idx])}
      />
      <View
        style={{
          paddingTop: 24 * p,
          paddingHorizontal: 16 * p,
          paddingBottom: 24 * p,
        }}>
        {tab == tabs[2] ? (
          <TouchableOpacity
            onPress={async () =>
              await Linking.openURL(
                'https://didattica.polito.it/img/RE_stati.jpg',
              )
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16 * p,
            }}>
            <TablerIcon
              name="help"
              size={12 * p}
              color={colors.gray200}
              style={{marginRight: 8 * p}}
            />
            <Text s={12} w="m" c={colors.gray200}>
              {t('statusCodeHelp')}
            </Text>
          </TouchableOpacity>
        ) : null}
        {tab == tabs[0] ? (
          <>
            <AvgWidget avg={avg} dark={dark} />
            <View
              style={{
                height: 1 * p,
                backgroundColor: colors.gray500,
                marginVertical: 24 * p,
              }}
            />
            <Section title={t('progressOverTime')} dark={dark}>
              <View
                style={{
                  height: 150 * p,
                  backgroundColor: colors.gray200,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text s={12 * p} w="m" c={colors.gray900}>
                  (Chart here)
                </Text>
              </View>
            </Section>
          </>
        ) : (
          <FlatList
            contentContainerStyle={
              {
                // paddingTop: 24 * p,
                // paddingHorizontal: 16 * p,
                // paddingBottom: 24 * p,
              }
            }
            data={filteredMarks}
            keyExtractor={item => item.date + item.name}
            renderItem={({item}) => (
              <MarkWidget
                mark={
                  tab == tabs[1]
                    ? (item as PermanentMark)
                    : (item as ProvisionalMark)
                }
                provisional={tab == tabs[2]}
                dark={dark}
              />
            )}
            ItemSeparatorComponent={() => <View style={{height: 16 * p}} />}
            ListEmptyComponent={<NoContent />}
            // refreshing={getExamsStatus.code == STATUS.PENDING}
            // refreshControl={
            //   <RefreshControl
            //     refreshing={getExamsStatus.code == STATUS.PENDING}
            //     onRefresh={refresh}
            //   />
            // }
          />
        )}
      </View>
    </Screen>
  );
};

const AvgWidget = ({avg, dark}: {avg: number; dark: boolean}) => {
  const {t} = useTranslation();

  return (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <View
        style={{
          width: 64 * p,
          height: 64 * p,
          borderRadius: 64 * p,
          borderWidth: 8 * p,
          borderColor: colors.accent300,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 20 * p,
        }}>
        <Text s={16 * p} w="b" c={dark ? colors.gray100 : colors.gray800}>
          {avg}
        </Text>
      </View>
      <View>
        <Text
          s={16 * p}
          w="m"
          c={dark ? colors.gray100 : colors.gray800}
          style={{marginBottom: 8 * p}}>
          {t('yourAverageMark')}*
        </Text>
        <Text s={10 * p} w="r" c={dark ? colors.gray300 : colors.gray600}>
          *{t('yourAverageMarkNotice')}
        </Text>
      </View>
    </View>
  );
};

const MarkWidget = ({
  mark,
  provisional,
  dark,
}: {
  mark: PermanentMark | ProvisionalMark;
  provisional: boolean;
  dark: boolean;
}) => {
  const fields = useMemo(
    () => getFields(mark, provisional, dark),
    [mark, provisional, dark],
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 16 * p,
        borderRadius: 4 * p,
        backgroundColor: dark ? colors.gray700 : colors.gray200,
        alignItems: 'flex-start',
      }}>
      <View style={{flexDirection: 'column', flex: 1}}>
        <View style={{flexDirection: 'row'}}>
          {provisional ? (
            <View
              style={{
                width: 16 * p,
                height: 16 * p,
                borderRadius: 16 * p,
                marginRight: 8 * p,
                backgroundColor: colors.gray200,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text s={10} w="b" c={colors.gray900}>
                {(mark as ProvisionalMark).status}
              </Text>
            </View>
          ) : null}
          <Text s={12 * p} w="m" c={dark ? colors.gray200 : colors.gray700}>
            {mark.name}
          </Text>
        </View>

        <View
          style={{
            flexDirection: provisional ? 'column' : 'row',
            marginTop: 16 * p,
          }}>
          {fields}
        </View>
      </View>
      {parseInt(mark.mark!) ? (
        <View style={{position: 'relative'}}>
          <Svg width={48 * p} height={48 * p}>
            <Circle
              transform="rotate(-90 28 28)"
              strokeWidth={4 * p}
              fill="transparent"
              stroke={colors.accent300}
              strokeDasharray={2 * Math.PI * 20 * p}
              strokeDashoffset={
                ((100 - 100 * ((parseInt(mark.mark!) || 30) / 30)) *
                  2 *
                  Math.PI *
                  20 *
                  p) /
                100
              }
              r={20 * p}
              cx={24 * p}
              cy={24 * p}></Circle>
          </Svg>
          <View
            style={{
              position: 'absolute',
              width: 48 * p,
              height: 48 * p,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              s={parseInt(mark.mark!) ? 16 * p : 10 * p}
              c={colors.gray100}
              w="b">
              {mark.mark}
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={{
            padding: 8 * p,
            borderRadius: 4 * p,
            backgroundColor: colors.accent300,
          }}>
          <Text s={12} w="m" c={colors.gray100}>
            {mark.mark}
          </Text>
        </View>
      )}
    </View>
  );
};

const getFields = (
  mark: PermanentMark | ProvisionalMark,
  provisional: boolean,
  dark: boolean,
) => {
  const perm_fields = ['date', 'credits'];
  const prov_fields = ['date', 'message'];

  const fields = provisional ? prov_fields : perm_fields;

  let icons: string[] = [];
  let values: string[] = [];

  fields.forEach(name => {
    switch (name) {
      case 'date':
        icons.push('calendar-time');
        values.push(moment(mark.date).format('ll'));
        break;
      case 'credits':
        icons.push('north-star');
        values.push(
          (mark as PermanentMark).num_credits + ' ' + i18next.t('credits'),
        );
        break;
      case 'message':
        icons.push('message');
        values.push((mark as ProvisionalMark).message || '');
        break;
      default:
        icons.push('');
        values.push('');
        break;
    }
  });

  return fields.map((name, i) => (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: name == 'message' ? 'flex-start' : 'center',
          flex: 1,
        },
        provisional && i > 0 ? {marginTop: 8 * p} : {},
      ]}>
      <TablerIcon
        name={icons[i]}
        size={16 * p}
        color={dark ? colors.gray200 : colors.gray700}
        style={{marginRight: 8 * p}}
      />
      <Text
        style={{marginRight: 8 * p}}
        s={10 * p}
        w="r"
        c={dark ? colors.gray200 : colors.gray700}>
        {values[i] || ''}
      </Text>
    </View>
  ));
};

export default Exams;