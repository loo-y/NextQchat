import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { AppState, AppThunk } from '../../store'
import { fetchCount, fetchTokenOrRefresh, fetchInterviewAnswer, fetchCareerList } from './API'
import {
    WhisperAnswerState,
    STATUS_TYPE,
    RECORDING_STATUS,
    CAREER_TYPE,
    RecordInfo,
    InterviewParams,
    CareerItem,
} from './interface'
import _ from 'lodash'

const initialState: WhisperAnswerState = {
    careerList: [],
    careerType: undefined,
    status: STATUS_TYPE.idle,
    value: 0,
    speechToken: undefined,
    memoryChatKey: new Date().getTime().toString(),
    recordInfo: {
        text: undefined, // text of recorded
        status: RECORDING_STATUS.idle, // status of recording
        recordingText: undefined, // text of recording
    },
    chatList: [],
}

export const getCareerListAsync = createAsyncThunk('whisperAnswerSlice/fetchCareerList', async () => {
    const response = await fetchCareerList()
    const { status, careerList, errorInfo } = response || {}
    if (status && !_.isEmpty(careerList)) {
        return careerList
    }
    return []
})

export const getAiAnswerAsync = createAsyncThunk(
    'whisperAnswerSlice/fetchInterviewAnswer',
    async (question: string, { getState, extra }: any) => {
        const whisperAnswerState: WhisperAnswerState = getWhisperAnswerState(getState())
        console.log(`whisperAnswerState`, whisperAnswerState)
        const {
            // careerType,
            memoryChatKey,
        } = whisperAnswerState || {}
        const response = await fetchInterviewAnswer({
            question,
            careerType: 'web front end developer',
            memoryChatKey,
        })
        const { status, result, error } = response || {}
        if (status && !_.isEmpty(result)) {
            return result
        }
        return {}
    }
)
export const getSpeechTokenAsync = createAsyncThunk('whisperAnswerSlice/fetchTokenOrRefresh', async () => {
    const response = await fetchTokenOrRefresh()
    const { status, authToken, region } = response || {}
    if (status) {
        return {
            authToken,
            region,
        }
    }
    return undefined
})

// The function below is called a thunk and allows us to perform async logic. It
// can be dispatched like a regular action: `dispatch(incrementAsync(10))`. This
// will call the thunk with the `dispatch` function as the first argument. Async
// code can then be executed and other actions can be dispatched. Thunks are
// typically used to make async requests.
export const incrementAsync = createAsyncThunk('whisperAnswerSlice/fetchCount', async (amount: number) => {
    console.log(`1111`)
    const response = await fetchCount(amount)
    // The value we return becomes the `fulfilled` action payload
    console.log(`2222`)
    return response.data
})

const updateCareerTypeReducer = (state: any, action: PayloadAction<CAREER_TYPE>) => {
    state.careerType = action.payload
}

export const whisperAnswerSlice = createSlice({
    name: 'whisperAnswerSlice',
    initialState,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
        updateServerData: (state, action: PayloadAction<any>) => {
            if (!_.isEmpty(action.payload)) {
                state = {
                    state,
                    ...action.payload,
                }
            }
        },
        updateCareerList: (state, action: PayloadAction<CareerItem[]>) => {
            if (!_.isEmpty(action.payload)) {
                state.careerList = _.uniqBy(_.concat(state.careerList, action.payload), 'id')
            }
        },
        updateRecording: (state, action: PayloadAction<RecordInfo>) => {
            const { chatList } = state || {}
            const { text, status } = action.payload || {}
            if (status == RECORDING_STATUS.idle) {
                state.recordInfo = {
                    ...state.recordInfo,
                    text: _.compact([state.recordInfo.text, state.recordInfo.recordingText]).join(', '),
                    recordingText: '',
                    status,
                }
            } else if (status == RECORDING_STATUS.recorded) {
                state.recordInfo = {
                    ...state.recordInfo,
                    text: _.compact([state.recordInfo.text, text]).join(', '),
                    status,
                }
            } else {
                state.recordInfo = {
                    ...state.recordInfo,
                    ...action.payload,
                }
            }
        },
        clearRecording: state => {
            state.recordInfo = {
                text: undefined,
                status: RECORDING_STATUS.idle,
                recordingText: undefined,
            }
        },
        increment: state => {
            // Redux Toolkit allows us to write "mutating" logic in reducers. It
            // doesn't actually mutate the state because it uses the Immer library,
            // which detects changes to a "draft state" and produces a brand new
            // immutable state based off those changes
            state.value += 1
        },
        decrement: state => {
            state.value -= 1
        },
        // Use the PayloadAction type to declare the contents of `action.payload`
        incrementByAmount: (state, action: PayloadAction<number>) => {
            state.value += action.payload
        },
        updateCareerType: updateCareerTypeReducer,
    },
    // The `extraReducers` field lets the slice handle actions defined elsewhere,
    // including actions generated by createAsyncThunk or in other slices.
    extraReducers: builder => {
        builder
            .addCase(incrementAsync.pending, state => {
                console.log(`loading`)
                state.status = STATUS_TYPE.loading
            })
            .addCase(incrementAsync.fulfilled, (state, action) => {
                console.log(`fulfilled`)
                state.status = STATUS_TYPE.fulfilled
                state.value += action.payload
            })
            .addCase(getSpeechTokenAsync.fulfilled, (state, action) => {
                console.log(`getSpeechTokenAsync.fulfilled`, { action })
                state.speechToken = action.payload
            })
            .addCase(getAiAnswerAsync.fulfilled, (state, action) => {
                const { memoryMessags } = action.payload || {}
                if (!_.isEmpty(memoryMessags)) {
                    state.chatList = _.orderBy(memoryMessags, ['timestamp'], ['desc'])
                }
            })
            .addCase(getCareerListAsync.fulfilled, (state, action) => {
                if (!_.isEmpty(action.payload)) {
                    state.careerList = action.payload
                }
            })
    },
})

export const {
    updateServerData,
    updateCareerList,
    updateRecording,
    clearRecording,
    increment,
    decrement,
    incrementByAmount,
    updateCareerType,
} = whisperAnswerSlice.actions

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
// export const selectCount = (state: AppState) => state.whisperAnswer.value
export const getWhisperAnswerState = (state: AppState) => state.whisperAnswer

// We can also write thunks by hand, which may contain both sync and async logic.
// Here's an example of conditionally dispatching actions based on current state.
export const incrementIfOdd =
    (amount: number): AppThunk =>
    (dispatch, getState) => {
        const whisperAnswerState = getWhisperAnswerState(getState())
        const currentValue = whisperAnswerState?.value
        if (currentValue % 2 === 1) {
            dispatch(incrementByAmount(amount))
        }
    }

export default whisperAnswerSlice.reducer
