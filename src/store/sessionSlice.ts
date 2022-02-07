/**
 * @file Manages actions and state related to login, logout and device registration
 */

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createDevice, getDeviceData } from '../utils/api-utils';
import {
  AuthStatus,
  AUTH_STATUS,
  errorStatus,
  initialStatus,
  pendingStatus,
  Status,
  successStatus,
} from './status';
import { RootState } from './store';
import { loadUser } from './userSlice';
import * as Keychain from 'react-native-keychain';
import { Device } from 'open-polito-api';
import defaultConfig, { Config } from '../defaultConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DeviceInfo = {
  uuid: string;
};

export type LoginData = {
  user: string;
  token: string;
};

type SessionState = {
  authStatus: AuthStatus;

  deviceRegisterStatus: Status;

  loginStatus: Status;
  loginData: LoginData | null;

  logoutStatus: Status;

  config: Config;
};

const initialState: SessionState = {
  authStatus: AUTH_STATUS.PENDING,

  deviceRegisterStatus: initialStatus,

  loginStatus: initialStatus,
  loginData: null,

  logoutStatus: initialStatus,

  config: defaultConfig,
};

/**
 * Given {@link Device}, calls {@link Device.register}.
 *
 * @remarks
 * Call this only before logging in with password.
 */
export const registerDevice = createAsyncThunk<
  void,
  Device,
  { state: RootState }
>('session/registerDevice', async (device, { dispatch }) => {
  const deviceData = getDeviceData();
  await device.register(deviceData);
});

/**
 * Logs in, either with token or with password.
 *
 * @remarks
 * When given "password" as login method, dispatches {@link registerDevice}.
 *
 * On login success, sets Keychain credentials and dispatches {@link loadUser}.
 */
export const login = createAsyncThunk<
  LoginData,
  {
    method: 'token' | 'password';
    username: string;
    token: string;
    device: Device;
  },
  { state: RootState }
>('session/login', async (args, { dispatch }) => {
  let response = null;
  if (args.method === 'token') {
    response = await args.device.loginWithToken(args.username, args.token);
  } else {
    await dispatch(registerDevice(args.device));
    response = await args.device.loginWithCredentials(
      args.username,
      args.token,
    );
  }
  const username = 'S' + response.user.anagrafica.matricola;
  await Keychain.setGenericPassword(
    username,
    JSON.stringify({ uuid: args.device.uuid, token: response.token }),
  );
  dispatch(loadUser(response.user));
  return { user: username, token: response.token };
});

/**
 * Clears keychain, logs out and sets auth status as NOT_VALID.
 * Ignores whether or not the logout has been correctly sent to the server.
 */
export const logout = createAsyncThunk<void, Device, { state: RootState }>(
  'session/logout',
  async (device, { dispatch }) => {
    await Keychain.resetGenericPassword();
    try {
      await device.logout();
    } finally {
      dispatch(setAuthStatus(AUTH_STATUS.NOT_VALID));
    }

  },
);

/**
 * Updates configuration in AsyncStorage and in store.
 * Returns void.
 */
export const setConfig = createAsyncThunk<void, Config, { state: RootState }>("session/setConfig", async (config, { dispatch }) => {
  await AsyncStorage.setItem("@config", JSON.stringify(config));
  dispatch(setConfigState(config));
});

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setAuthStatus: (state, action: PayloadAction<AuthStatus>) => {
      state.authStatus = action.payload;
    },
    setConfigState: (state, action: PayloadAction<Config>) => {
      state.config = action.payload;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(registerDevice.pending, state => {
        state.deviceRegisterStatus = pendingStatus();
      })
      .addCase(registerDevice.fulfilled, state => {
        state.deviceRegisterStatus = successStatus();
      })
      .addCase(registerDevice.rejected, (state, action) => {
        state.deviceRegisterStatus = errorStatus(action.error);
      })

      .addCase(login.pending, state => {
        state.loginStatus = pendingStatus();
        state.authStatus = AUTH_STATUS.PENDING;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loginStatus = successStatus();
        state.authStatus = AUTH_STATUS.VALID;
        state.loginData = {
          user: action.payload?.user,
          token: action.payload?.token,
        };
      })
      .addCase(login.rejected, (state, action) => {
        state.authStatus = AUTH_STATUS.NOT_VALID;
        state.loginStatus = errorStatus(action.error);
      });
  },
});

export const { setAuthStatus, setConfigState } = sessionSlice.actions;

export default sessionSlice.reducer;