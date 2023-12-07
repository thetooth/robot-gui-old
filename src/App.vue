<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import '@carbon/web-components/es/components/ui-shell/index.js';
import '@carbon/web-components/es/components/button/index.js';
import '@carbon/web-components/es/components/icon-button/index.js';
import '@carbon/web-components/es/components/slider/index.js';
import '@carbon/web-components/es/components/toggle/index.js';
import '@carbon/web-components/es/components/progress-indicator/index'
import { JSONCodec } from "nats.ws";
import { useNCStore } from "./stores/nc"

import Activity from '@carbon/icons-vue/es/activity/16';
import DataCollection from '@carbon/icons-vue/es/data-collection/16'
import TreeView from '@carbon/icons-vue/es/tree-view/16'
import Fragile from '@carbon/icons-vue/es/fragile/16'

import Model from './components/Model.vue'
import SetPosition from './components/SetPosition.vue'
import Teach from './components/Teach.vue'
import Dynamics from './components/Dynamics.vue'

export default {
    components: {
        Activity,
        DataCollection,
        TreeView,
        Fragile,

        Model,
        SetPosition,
        Teach,
        Dynamics
    },
    setup() {
        const store = useNCStore()
        const jc = new JSONCodec()

        let view = ref(0);

        let statusSub = ref(null);

        let hearbeat = ref();
        let hearbeatIndictor = ref();
        let hearbeatInterval = null;

        let alarm = ref();
        let state = ref();

        let diagmsg = ref();
        let otgStatus = ref(-1);
        const otgStatusTable = new Map([
            [0, 'The trajectory is calculated normally'],
            [1, 'The trajectory has reached its final position'],
            [-1, 'Unclassified error'],
            [-100, 'Error in the input parameter'],
            [-101, 'The trajectory duration exceeds its numerical limits'],
            [-102, 'The trajectory exceeds the given positional limits'],
            [-103, 'The trajectory cannot be phase synchronized'],
            [-104, 'The trajectory is not valid due to a conflict with zero limits'],
            [-110, 'Error during the extremel time calculation (Step 1)'],
            [-111, 'Error during the synchronization calculation (Step 2)']
        ])
        let lastIn = 0;
        let msgps = ref(0.0);

        onMounted(async () => {
            await store.setup();
            statusSub = store.nc.subscribe("motion.status");

            hearbeatInterval = setInterval(async () => {
                if (hearbeat.value) {
                    hearbeatIndictor.value = true;
                    setTimeout(() => { hearbeatIndictor.value = false }, 100)
                } else {
                    hearbeatIndictor.value = false;
                }
                hearbeat.value = false
                let stats = store.nc.stats();
                msgps.value = stats.inMsgs + stats.outMsgs - lastIn;
                lastIn = stats.inMsgs + stats.outMsgs;
            }, 1000);

            (async () => {
                for await (const m of statusSub) {
                    let payload = jc.decode(m.data);
                    store.run = payload.run;
                    alarm.value = payload.alarm;
                    state.value = payload.state;
                    diagmsg.value = payload.diagMsg;
                    otgStatus.value = payload.otg.result;
                    store.dro.pose = payload.pose;
                    hearbeat.value = true

                    const gamepads = navigator.getGamepads();
                    for (const gp of gamepads) {
                        if (gp == null) {
                            continue
                        }

                        if (Math.abs(gp.axes[0]) < 0.01 && Math.abs(gp.axes[1]) < 0.01) {
                            continue
                        }

                        const mult = (1 / Math.pow(3, 4)) * Math.pow(Math.exp(gp.axes[2] + 1), 5.01);

                        store.controls.x += gp.axes[0] * mult * (1 / 120);
                        store.controls.y += gp.axes[1] * mult * (1 / 120);
                        store.controls.r += gp.axes[3] * mult * (1 / 120)
                        store.immediate(store.controls.x, store.controls.y, store.controls.z);
                        break;
                    }
                }
            })();

        })
        onBeforeUnmount(() => {
            clearInterval(hearbeatInterval);
            statusSub.unsubscribe();

            store.nc.close();
        })

        return {
            store, view, hearbeatIndictor, alarm, state, diagmsg, otgStatus, otgStatusTable, msgps,
        }
    }
}

</script>

<template>
    <cds-header>
        <cds-header-name href="javascript:void 0" prefix="BotCtrl">[Alpha]</cds-header-name>
        <Activity :class="[hearbeatIndictor ? 'activity-ok' : 'activity-bad']" />
        <cds-button kind="ghost">{{ state }}</cds-button>
        <cds-button v-if="store.run" kind="warning">Running</cds-button>
        <cds-button v-if="alarm" kind="danger">Alarm</cds-button>
        <div class="cds--header__global">
            <cds-header-global-action aria-label="Commisioning" tooltip-text="Commisioning" kind="primary" size="lg"
                tooltip-alignment="" tooltip-position="bottom" type="button" @click="view = 0">
                <DataCollection slot="icon" />
            </cds-header-global-action>
            <cds-header-global-action aria-label="Dynamics" tooltip-text="Dynamics" tooltip-alignment="right" kind="primary"
                size="lg" tooltip-position="bottom" type="button" @click="view = 1">
                <Fragile slot="icon" />
            </cds-header-global-action>
        </div>
    </cds-header>

    <div class="main">
        <div class="model">
            <cds-progress-indicator class="progress" v-if="store.ready">
                <cds-progress-step :state="(store.nc.protocol.connected ? 'complete' : 'invalid')" label="Message Bus"
                    secondary-label="Connected"></cds-progress-step>
                <cds-progress-step :state="(msgps >= 120 ? 'complete' : 'invalid')" label="Telemetry"
                    :secondary-label="msgps + ' msg/s'"></cds-progress-step>
                <cds-progress-step state="invalid" label="Homing" secondary-label="Invalid"></cds-progress-step>
                <cds-progress-step state="current" label="Motion Plan"
                    secondary-label="No behavior defined"></cds-progress-step>
                <!-- <cds-progress-step disabled="" label="Execute" state="incomplete"></cds-progress-step> -->
            </cds-progress-indicator>
            <Model v-if="store.ready" />
        </div>
        <div class="editor">
            <SetPosition v-if="store.ready && view == 0" />
            <Teach v-if="store.ready && view == 0" />
            <Dynamics v-if="store.ready && view == 1" />
        </div>
        <div class="controls">
            <cds-button @click="store.stop" kind="danger"><img class="icon" src="@/assets/stop.svg" />Stop</cds-button>
            <cds-button @click="store.start"><img class="icon" src="@/assets/start.svg" />Start</cds-button>
            <cds-button @click="store.reset" kind="secondary"><img class="icon"
                    src="@/assets/reset.svg" />Reset</cds-button>
        </div>
    </div>

    <div class="dro">
        <pre>
X:          {{ store.dro.pose.x.toFixed(3) }}mm
Y:          {{ store.dro.pose.y.toFixed(3) }}mm
Z:          {{ store.dro.pose.z.toFixed(3) }}mm
R:          {{ store.dro.pose.r.toFixed(3) }}&deg;

Alpha:      {{ store.dro.pose.alpha.toFixed(3) }}&deg;
Beta:       {{ store.dro.pose.beta.toFixed(3) }}&deg;
Phi:        {{ store.dro.pose.phi.toFixed(3) }}&deg;
Theta:      {{ store.dro.pose.theta.toFixed(3) }}&deg;
Alpha V:    {{ store.dro.pose.alphaVelocity.toFixed(3) }}&deg;/s
Beta V:     {{ store.dro.pose.betaVelocity.toFixed(3) }}&deg;/s
Phi V:      {{ store.dro.pose.phiVelocity.toFixed(3) }}&deg;/s
Theta V:    {{ store.dro.pose.thetaVelocity.toFixed(3) }}&deg;/s

OTG:        {{ otgStatusTable.get(otgStatus) }}

Diag:
{{ diagmsg }}

GPX:    {{ store.controls.x.toFixed(3) }}mm
GPY:    {{ store.controls.y.toFixed(3) }}mm
        </pre>
    </div>
</template>

<style lang="scss" scoped>
@use '@carbon/themes/scss/themes' as *;
@use '@carbon/themes';

::-webkit-scrollbar {
    display: none;
}

.dro {
    position: absolute;
    width: 20%;
    top: 3rem;
    left: 0;
    padding: 1.1rem;
}

.controls {
    display: flex;
    position: absolute;
    bottom: 0;
}

.main {
    display: flex;
    height: 100vh;
}

.model {
    flex-basis: 75%;
    max-width: 75%;
    max-height: 100vh;
    overflow: hidden;
}

.progress {
    position: relative;
    top: 4.5rem;
    justify-content: flex-end;
    @include themes.theme($g10);
}

.editor {
    flex-basis: 25%;
    min-width: 480px;
    margin-top: 3rem;
    background-color: var(--cds-layer-01);
    color: var(--cds-text-secondary);
    overflow: scroll;
}

.icon {
    filter: invert(100%);
    max-width: 16px;
    max-height: 16px;
    margin-top: 1px;
    margin-right: 6px;
}

.icon-alt {
    max-width: 16px;
    max-height: 16px;
    margin-top: 1px;
    margin-right: 6px;
}

.activity-ok {
    filter: invert(82%) sepia(55%) saturate(4985%) hue-rotate(39deg) brightness(94%) contrast(82%);
}

.activity-bad {
    filter: invert(30%);
}
</style>
