import CharacterForm from "@/components/nodeForms/CharacterForm";
import FactionForm from "@/components/nodeForms/FactionForm";
import CityForm from "@/components/nodeForms/CityForm";
import EventForm from "@/components/nodeForms/EventForm";
import LocationForm from "@/components/nodeForms/LocationForm";
import { defaultCityData } from "@/schemas/citySchema";
import { defaultEventData } from "@/schemas/eventSchema";
import { defaultFactionData } from "@/schemas/factionSchema";
import { defaultLocationData } from "@/schemas/locationSchema";
import { defaultCharacterData } from "@/schemas/characterSchema";

export const nodeTypeRegistry = {
  character: {
    Form: CharacterForm,
    defaultData: defaultCharacterData,
  },
  faction: {
    Form: FactionForm,
    defaultData: defaultFactionData,
  },
  city: {
    Form: CityForm,
    defaultData: defaultCityData,
  },
  event: {
    Form: EventForm,
    defaultData: defaultEventData,
  },
  location: {
    Form: LocationForm,
    defaultData: defaultLocationData,
  },
};
