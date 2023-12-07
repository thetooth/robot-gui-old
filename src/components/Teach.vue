<script>
import { ref, onMounted, onUpdated, onBeforeUnmount } from 'vue';
import { useNCStore } from "../stores/nc"
import { JSONCodec } from "nats.ws";

import Recording from '@carbon/icons-vue/es/recording/16'
import Stop from '@carbon/icons-vue/es/stop/16'
import Play from '@carbon/icons-vue/es/play/16'
import Erase from '@carbon/icons-vue/es/erase/16'
import Delete from '@carbon/icons-vue/es/delete/16'
import SkipBack from '@carbon/icons-vue/es/skip--back/16'
import SkipForward from '@carbon/icons-vue/es/skip--forward/16'
import Draw from '@carbon/icons-vue/es/draw/16'

// import { modelRef, scene } from '../scene';

export default {
    components: {
        Recording,
        Stop,
        Play,
        Erase,
        Delete,
        SkipBack,
        SkipForward,
        Draw
    },
    setup() {
        const store = useNCStore();
        const jc = new JSONCodec();

        let recorderSub = ref();

        let recStatus = ref({
            state: "",
            mode: "",
            size: 0,
            playhead: 0,
            poses: [{ x: 0, y: 0 }]
        });
        let allowableError = ref(0.1);
        let direct = ref(true);
        const speed = ref(1);

        onMounted(async () => {
            console.log('Teach is mounted');

            recorderSub = store.nc.subscribe("teach.status");

            (async () => {
                for await (const m of recorderSub) {
                    let payload = jc.decode(m.data);

                    recStatus.value = payload;
                    if (recStatus.value.state == "Replay") {
                        store.playing = true
                    } else {
                        store.playing = false
                    }
                }
            })();
        });
        onBeforeUnmount(async () => {
            recorderSub.unsubscribe();
        });

        function record() {
            store.nc.publish('teach.record', jc.encode(null))
        }
        function stop() {
            store.playing = false;
            store.nc.publish('teach.stop', jc.encode(null))
        }
        function replay() {
            store.playing = true;
            store.nc.publish('teach.replay', jc.encode(1))
        }
        function replaySpeed(s) {
            store.nc.publish('teach.setting.speed', jc.encode(s))
        }
        function positionError(e) {
            store.nc.publish('teach.setting.error', jc.encode(e))
        }
        function recordDirect(direct) {
            store.nc.publish('teach.setting.direct', jc.encode(direct))
        }
        function del() {
            store.nc.publish('teach.delete', jc.encode(null))
        }
        function clear() {
            store.nc.publish('teach.clear', jc.encode(null))
        }
        function back() {
            store.nc.publish('teach.back', jc.encode(null))
        }
        function forward() {
            store.nc.publish('teach.forward', jc.encode(null))
        }

        return {
            record, stop, replay, replaySpeed, positionError, recordDirect, del, clear, back, forward,
            store, recStatus, allowableError, direct, speed,
        }
    }
}
</script>

<template>
    <div class="cds--grid cds--grid--condensed">
        <div class="cds--row">
            <h4>
                Teach Waypoints
            </h4>
        </div>

        <div class="cds--row">
            <div class="cds--col">State: {{ recStatus.state }}</div>
            <div class="cds--col">Mode: {{ recStatus.mode }}</div>
        </div>
        <div class="cds--row">
            <div class="cds--col">Play Head: {{ recStatus.playhead }}</div>
            <div class="cds--col">Buffer: {{ recStatus.size }}</div>
        </div>
    </div>
    <div class="cds--grid cds--grid--condensed">
        <div class="cds--row controls">
            <div class="cds--col">
                <cds-icon-button size="lg" kind="danger" @click="record">
                    <span slot="icon">
                        <Recording />
                    </span>
                    <span slot="tooltip-content">Record</span>
                </cds-icon-button>
                <cds-icon-button size="lg" kind="primary" @click="replay">
                    <span slot="icon">
                        <Play />
                    </span>
                    <span slot="tooltip-content">Replay</span>
                </cds-icon-button>
                <cds-icon-button size="lg" kind="secondary" @click="stop">
                    <span slot="icon">
                        <Stop />
                    </span>
                    <span slot="tooltip-content">Stop</span>
                </cds-icon-button>
                <cds-icon-button size="lg" kind="secondary" @click="back">
                    <span slot="icon">
                        <SkipBack />
                    </span>
                    <span slot="tooltip-content">Back</span>
                </cds-icon-button>
                <cds-icon-button size="lg" kind="secondary" @click="forward">
                    <span slot="icon">
                        <SkipForward />
                    </span>
                    <span slot="tooltip-content">Forward</span>
                </cds-icon-button>
                <cds-icon-button size="lg" kind="secondary" @click="del">
                    <span slot="icon">
                        <Delete />
                    </span>
                    <span slot="tooltip-content">Delete</span>
                </cds-icon-button>
                <cds-icon-button size="lg" kind="secondary" @click="clear">
                    <span slot="icon">
                        <Erase />
                    </span>
                    <span slot="tooltip-content">Clear All</span>
                </cds-icon-button>
            </div>
        </div>

        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="Positioning Error" max="5" min="0.01" step="0.01" :value="allowableError"
                    @cds-slider-changed="allowableError = $event.detail.value; positionError(allowableError)"></cds-slider>
            </div>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-checkbox label-a="On" label-text="Enable Direct Mode" size="sm" label-b="Off" :checked="direct"
                    @cds-checkbox-changed="direct = $event.detail.checked; recordDirect(direct)"></cds-checkbox>
            </div>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="Direct Mode Speed" max="10" min="1" step="1" :value="speed"
                    @cds-slider-changed="speed = $event.detail.value; replaySpeed(speed)"></cds-slider>
            </div>
        </div>

    </div>
    <div class="cds--grid cds--grid--condensed" style="overflow-y: scroll;" v-if="false">
        <div class="cds--row">
            <h4>
                <Draw class="icon-alt" />Path
            </h4>
        </div>
        <div class="cds--row" v-for="v, i in recStatus.poses">
            <div class="cds--col">P{{ i }} </div>
            <div class="cds--col">DX: {{ v.x.toFixed(3) }}mm</div>
            <div class="cds--col">DY: {{ v.y.toFixed(3) }}mm</div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use '@carbon/layout';

.controls {
    margin-top: layout.$spacing-07;
    margin-bottom: layout.$spacing-07;
}
</style>