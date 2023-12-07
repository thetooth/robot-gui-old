<script>
import { ref, onMounted, toRaw } from 'vue';
import { useNCStore } from "../stores/nc"
import { JSONCodec } from "nats.ws";


export default {
    components: {
    },
    setup() {
        const store = useNCStore();
        const js = new JSONCodec();

        function motionSettings() {
            store.nc.publish('motion.settings', js.encode(toRaw(store.settings)))
        }

        onMounted(async () => {
            console.log('Dynamics is mounted');
        });

        return {
            store,
            motionSettings
        }
    }
}
</script>

<template>
    <div class="cds--grid cds--grid--condensed" v-for="(setting, index) in store.settings">
        <div class="cds--row">
            <h4>
                Axis {{ index + 1 }}
            </h4>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="Max Velocity" max="1000" min="10" step="10" :value="setting['max-velocity']"
                    :disabled="store.run"
                    @cds-slider-changed="setting['max-velocity'] = $event.detail.value; motionSettings()">
                    <cds-slider-input aria-label="Slider value" type="number"></cds-slider-input>
                </cds-slider>
            </div>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="Max Acceleration" max="10000" min="100" step="100"
                    .value="setting['max-acceleration']" :disabled="store.run"
                    @cds-slider-changed="setting['max-acceleration'] = $event.detail.value; motionSettings()">
                    <cds-slider-input aria-label="Slider value" type="number"></cds-slider-input>
                </cds-slider>
            </div>
        </div>
        <div class="cds--row">
            <div class="cds--col">
                <cds-slider label-text="Max Jerk" max="90000" min="10" step="100" .value="setting['max-jerk']"
                    :disabled="store.run" @cds-slider-changed="setting['max-jerk'] = $event.detail.value; motionSettings()">
                    <cds-slider-input aria-label="Slider value" type="number"></cds-slider-input>
                </cds-slider>
            </div>
        </div>
    </div>
</template>