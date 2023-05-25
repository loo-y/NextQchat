// Speech to text by microphone
import _ from 'lodash'
import React, { useEffect, Fragment, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/hooks'
import { getWhisperAnswerState, getSpeechTokenAsync, updateRecording } from '../slice'
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk'
import { AnyObj, SpeechToken, RECORDING_STATUS } from '../interface'
import { recordingIdleGap } from '../constants'
const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

const SttMic = () => {
    const dispatch = useAppDispatch()
    const state = useAppSelector(getWhisperAnswerState)
    const { speechToken, recordInfo } = state || {}
    const [triggerMic, setTriggerMic] = useState(false)
    // console.log(`recordInfo`, recordInfo)
    useEffect(() => {
        dispatch(getSpeechTokenAsync())
    }, [])

    let lastRecordingInfo: any = {},
        recordingIdleTimer: any = null
    const handleRecording = (result: any) => {
        // console.log(`this is result`, result)
        const { resultId, text, offset, duration } = result || {}
        const lastResultoffset = lastRecordingInfo?.offset
        const lastText = lastRecordingInfo?.text || ``
        if (!!lastResultoffset && lastResultoffset != offset) {
            dispatch(
                updateRecording({
                    text: lastText,
                    recordingText: text,
                    status: RECORDING_STATUS.recorded,
                })
            )
        } else {
            dispatch(
                updateRecording({
                    recordingText: text,
                    status: RECORDING_STATUS.recording,
                })
            )
        }

        clearTimeout(recordingIdleTimer)
        recordingIdleTimer = setTimeout(() => {
            lastRecordingInfo = {}
            dispatch(
                updateRecording({
                    status: RECORDING_STATUS.idle,
                })
            )
        }, recordingIdleGap)

        lastRecordingInfo = {
            resultId,
            text,
            offset,
            duration,
        }
    }

    useEffect(() => {
        console.log(`recordInfo`, recordInfo)
    }, [recordInfo])
    useEffect(() => {
        if (!speechToken) {
            dispatch(getSpeechTokenAsync())
        } else if (triggerMic) {
            console.log('state.speechToken', speechToken)
            sttFromMic(speechToken, handleRecording, setTriggerMic)
        }
    }, [speechToken, triggerMic])

    return (
        <div>
            <label onClick={() => setTriggerMic(true)}>aaaa</label>
        </div>
    )
}

export default SttMic

const sttFromMic = async (speechToken: SpeechToken, recording: (arg: any) => void, callback?: (arg: any) => void) => {
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(speechToken.authToken, speechToken.region)
    speechConfig.speechRecognitionLanguage = 'zh-CN'

    const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput()
    const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig)

    // this.setState({
    //     displayText: 'speak into your microphone...'
    // });

    recognizer.recognizing = function (s: any, e: AnyObj) {
        // console.log(`this is s`, s)
        // console.log(`this is e`, e)
        // console.log('RECOGNIZING: ' + e.result.text)
        // console.log('Offset in Ticks: ' + e.result.offset)
        // console.log('Duration in Ticks: ' + e.result.duration)
        console.log('Duration in Ticks: ', e.result)
        recording(e?.result)
    }

    recognizer.startContinuousRecognitionAsync()

    if (callback) {
        callback(false)
    }
    // recognizer.recognizeOnceAsync(result => {
    //     let displayText;
    //     if (result.reason === ResultReason.RecognizedSpeech) {
    //         displayText = `RECOGNIZED: Text=${result.text}`
    //     } else {
    //         displayText = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
    //     }

    //     this.setState({
    //         displayText: this.state.displayText + `\r\n${result.text}`
    //     });

    // });
}
