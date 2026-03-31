import json
import random
import math
import os

# Set seed for reproducible map points
random.seed(42)

# Guangzhou roughly: Lat 22.9 to 23.4, Lng 113.1 to 113.6
# Shenzhen roughly: Lat 22.4 to 22.8, Lng 113.7 to 114.3
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def main():
    stations = []
    for i in range(1, 36):
        in_guangzhou = random.random() > 0.5
        if in_guangzhou:
            lat = random.uniform(22.9, 23.4)
            lon = random.uniform(113.1, 113.6)
            city = "Guangzhou"
        else:
            lat = random.uniform(22.4, 22.8)
            lon = random.uniform(113.7, 114.3)
            city = "Shenzhen"
            
        stations.append({
            "stationId": f"ST-{i:03d}",
            "name": f"{city} Hub {i}",
            "city": city,
            "location": {
                "type": "Point",
                "coordinates": [lon, lat] # GeoJSON specifies Longitude first!
            },
            "totalPiles": random.randint(10, 50)
        })

    adj_matrix = {}
    for i, s1 in enumerate(stations):
        distances = []
        lat1, lon1 = s1["location"]["coordinates"][1], s1["location"]["coordinates"][0]
        
        for j, s2 in enumerate(stations):
            if s1["stationId"] != s2["stationId"]:
                lat2, lon2 = s2["location"]["coordinates"][1], s2["location"]["coordinates"][0]
                dist = haversine(lat1, lon1, lat2, lon2)
                distances.append({"id": s2["stationId"], "distance": dist})
        
        # Sort and pick top 3
        distances.sort(key=lambda x: x["distance"])
        top3 = [d["id"] for d in distances[:3]]
        s1["neighbors"] = top3
        adj_matrix[s1["stationId"]] = top3

    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    stations_path = os.path.join(backend_dir, "stations_metadata.json")
    with open(stations_path, "w") as f:
        json.dump(stations, f, indent=2)

    adj_matrix_path = os.path.join(backend_dir, "adjacency_matrix.json")
    with open(adj_matrix_path, "w") as f:
        json.dump(adj_matrix, f, indent=2)
        
    print(f"Generated stations metadata at {stations_path}")
    print(f"Generated adjacency matrix at {adj_matrix_path}")

if __name__ == "__main__":
    main()
