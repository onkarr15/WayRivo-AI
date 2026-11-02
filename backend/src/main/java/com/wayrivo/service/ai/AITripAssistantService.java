package com.wayrivo.service.ai;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class AITripAssistantService {

    public Map<String, Object> generateTripInsights(String destination, String travelStyle, Integer days) {
        Map<String, Object> insights = new HashMap<>();
        insights.put("destination", destination);
        insights.put("travelStyle", travelStyle != null ? travelStyle : "Custom");
        insights.put("estimatedDays", days != null ? days : 5);

        List<String> highlights = new ArrayList<>();
        List<String> packingTips = new ArrayList<>();
        List<String> localEtiquette = new ArrayList<>();

        String destLower = destination != null ? destination.toLowerCase() : "";

        if (destLower.contains("kerala")) {
            highlights.addAll(List.of("Alleppey Backwaters Houseboat Cruise", "Munnar Tea Garden Treks", "Thekkady Spice Plantations", "Kathakali Classical Dance"));
            packingTips.addAll(List.of("Breathable cotton fabrics", "Mosquito repellent", "Light rain jacket", "Slip-on footwear for boats"));
            localEtiquette.addAll(List.of("Remove footwear before entering traditional homes and temples", "Dress modestly around religious sites"));
        } else if (destLower.contains("goa")) {
            highlights.addAll(List.of("North Goa Beach Shacks & Watersports", "South Goa Heritage Portuguese Quarters", "Dudhsagar Waterfalls Trek", "Spice Village Lunch"));
            packingTips.addAll(List.of("Beachwear & sunscreen (SPF 50+)", "UV sunglasses", "Waterproof pouch for phones", "Comfortable flip-flops"));
            localEtiquette.addAll(List.of("Swim only in designated lifeguard zones", "Respect local beach cleanliness policies"));
        } else if (destLower.contains("rajasthan") || destLower.contains("jaipur") || destLower.contains("udaipur")) {
            highlights.addAll(List.of("Amber Fort & City Palace Tours", "Lake Pichola Sunset Boat Ride", "Thar Desert Camel Safari", "Authentic Dal Baati Churma Feast"));
            packingTips.addAll(List.of("Sunhat & scarf for desert breeze", "Comfortable walking shoes", "Light shawl for cool desert evenings"));
            localEtiquette.addAll(List.of("Ask before photographing locals in rural villages", "Always accept hospitality with right hand"));
        } else {
            highlights.addAll(List.of("Curated Local Sightseeing", "Authentic Regional Cuisine Experience", "Heritage & Cultural Walking Tour", "Scenic Landscape Viewpoints"));
            packingTips.addAll(List.of("All-weather comfortable apparel", "Portable power bank", "Universal power adapter", "Personal medical kit"));
            localEtiquette.addAll(List.of("Carry digital and physical copies of government IDs", "Support local artisan cooperatives"));
        }

        insights.put("highlights", highlights);
        insights.put("packingTips", packingTips);
        insights.put("localEtiquette", localEtiquette);
        insights.put("aiEngine", "WayRivo Hybrid Intelligence v1");

        return insights;
    }
}
