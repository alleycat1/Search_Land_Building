import React,{ useState, useEffect } from "react";
import axios from "axios";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import Head from "next/head";
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet';
import wkx from 'wkx';
import 'leaflet/dist/leaflet.css';

const center = [35.67843, 139.764603];

export default function MyComponent() {
    const [data, setData] = useState([]);
    const [prefecture, setPrefecture] = useState("");
    const [cities, setCities] = useState([]);
    const [city, setCity] = useState("");
    const [fullNames, setFullNames] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [isButtonClicked, setIsButtonClicked] = useState(false);
    const [isButtonClicked2, setIsButtonClicked2] = useState(false);
    const [displayedFullNames, setDisplayedFullNames] = useState([]);
    const [jukyoNum, setJukyoNum] = useState("");
    const [chibanNum, setChibanNum] = useState("");

    const [searchText2, setSearchText2] = useState("");
  
    const uniquePrefectures = [...new Set(data.map((item) => item.pref_name))];
  
    useEffect(() => {
      async function fetchData() {
        const response = await axios.get("http://172.16.52.128:5000/api");
        setData(response.data);
      }
      fetchData();
    }, []);
  
    useEffect(() => {
      if (prefecture !== "") {
        const filteredCities = data
          .filter((item) => item.pref_name === prefecture)
          .map(
            (item) =>
              item.city_name + (item.od_city_name ? item.od_city_name : "")
          );
        setCities(filteredCities);
      } else {
        setCities([]);
      }
    }, [prefecture, data]);
  
    useEffect(() => {
      async function fetchFullNames() {
          if (isButtonClicked && prefecture !== "" && city !== "" && searchText !== "") {
              const filteredData = data.filter(
                  (item) =>
                      item.pref_name === prefecture &&
                      (item.city_name + (item.od_city_name ? item.od_city_name : "")) === city
              );
              if (filteredData.length > 0) {
                  const lgCodePrefix = filteredData[0].lg_code.substring(0, 6);
                  try {
                      const response = await axios.get("http://172.16.52.128:5000/views", {
                          params: { lgCodePrefix, searchText, jukyoNum },
                      });
                      const filteredFullNames = response.data.map((row) => row.full_name);
                      setFullNames(filteredFullNames);
                  } catch (error) {
                      console.error(error);
                  }
              }
          }
          setIsButtonClicked(false);
      }
      fetchFullNames();
  }, [isButtonClicked, prefecture, city, data, searchText, jukyoNum]);

  useEffect(() => {
    async function fetchFullNames2() {
        if (isButtonClicked2 && prefecture !== "" && city !== "" && searchText2 !== "") {
            const filteredData = data.filter(
                (item) =>
                    item.pref_name === prefecture &&
                    (item.city_name + (item.od_city_name ? item.od_city_name : "")) === city
            );
            if (filteredData.length > 0) {
                const lgCodePrefix = filteredData[0].lg_code.substring(0, 6);
                try {
                    const response = await axios.get("http://172.16.52.128:5000/views2", {
                        params: { lgCodePrefix, searchText2, chibanNum },
                    });
                    const filteredFullNames = response.data.map((row) => row.cms_full_name);
                    setFullNames(filteredFullNames);
                } catch (error) {
                    console.error(error);
                }
            }
        }
        setIsButtonClicked2(false);
    }
    fetchFullNames2();
}, [isButtonClicked2, prefecture, city, data, searchText2, chibanNum]);
  
    useEffect(() => {
      setCurrentPage(1);
    }, [itemsPerPage]);
  
    useEffect(() => {
      if (isButtonClicked) {
        const filteredNames = fullNames.filter((fullName) =>
          fullName, searchText
        );
        setDisplayedFullNames(filteredNames);
      } else {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const slicedNames = fullNames.slice(startIndex, endIndex);
        setDisplayedFullNames(slicedNames);
      }
    }, [fullNames, itemsPerPage, currentPage, searchText, isButtonClicked]);

    const containsSearchText = (text, search) => {
      if (text.includes(search)) {
        return true;
      }
      return text.includes(search) || text.includes(search);
    };

    useEffect(() => {
      if (isButtonClicked2) {
        const filteredNames = fullNames.filter((fullName) =>
          containsSearchText(fullName, searchText2)
        );
        setDisplayedFullNames(filteredNames);
      } else {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const slicedNames = fullNames.slice(startIndex, endIndex);
        setDisplayedFullNames(slicedNames);
      }
    }, [fullNames, itemsPerPage, currentPage, searchText2, isButtonClicked2]);
  
    const totalPages = Math.ceil(fullNames.length / itemsPerPage);
  
    const nextPage = () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    };
  
    const previousPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };
  
    const handleItemsPerPageChange = (event) => {
      setItemsPerPage(Number(event.target.value));
    };
  
    const handleButtonClick = () => {
      setIsButtonClicked(true);
    };

    const handleButtonClick2 = () => {
      setIsButtonClicked2(true);
    };

    const [data2, setData2] = useState([]);
    const [zoomLevel, setZoomLevel] = useState(20); // <-- Add this

    useEffect(() => {
      if (prefecture !== "" && city !== "") {
        const filteredData = data.filter(
          (item) =>
              item.pref_name === prefecture &&
              (item.city_name + (item.od_city_name ? item.od_city_name : "")) === city
        );
        const lgCodePrefix = filteredData[0].lg_code.substring(0, 7);
    
        axios.get("http://172.16.52.128:5000/bbb", {
          params: { lgCodePrefix: lgCodePrefix }
        })
          .then(response => {
            const geojsons = response.data.map(record => {
              const buffer = Buffer.from(record.plygn_geom1, 'hex');
              const geometry = wkx.Geometry.parse(buffer);
              return geometry.toGeoJSON();
            });
            setData2(geojsons);
          })
          .catch(error => console.error(error));
      }
    }, [prefecture, city]);

    const MapEvents = () => { // <-- Add this
      const map = useMapEvents({
        zoomend: () => {
          setZoomLevel(map.getZoom());
        },
      });
      return null;
    };
    
  
    
  
    return (
      <>
        <select
          className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-5 max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
          value={prefecture}
          onChange={(e) => setPrefecture(e.target.value)}
        >
          <option value=""></option>
          {uniquePrefectures.map((prefecture, index) => (
            <option key={index} value={prefecture}>
              {prefecture}
            </option>
          ))}
        </select>
  
        <select
          className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-5 max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value=""></option>
          {cities.map((city, index) => (
            <option key={index} value={city}>
              {city}
            </option>
          ))}
        </select>
  
        <input
          type="text"
          placeholder="町字/町丁目/小字"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <input
            type="text"
            placeholder="街区・住居番号"
            value={jukyoNum}
            onChange={(e) => setJukyoNum(e.target.value)}
        />

        <input
          placeholder="家屋番号テーブル空。"
        />

        <input
          placeholder="種類テーブル空"
        />

　　　　 <input
          placeholder="構造テーブル空"
        />
        <input
          placeholder="床面積テーブル空"
        />
        <input
          placeholder="登記日テーブル空"
        />
        <input
          placeholder="建物名テーブル空"
        />
  
        <button onClick={handleButtonClick}>検索</button>

        <br />

        <input
          type="text"
          placeholder="町字/町丁目/小字(地番"
          value={searchText2}
          onChange={(e) => setSearchText2(e.target.value)}
        />

        <input
            type="text"
            placeholder="街区・住居番号(地番)テーブル空"
            value={chibanNum}
            onChange={(e) => setChibanNum(e.target.value)}
        />

        <button onClick={handleButtonClick2}>検索</button>

        <input 
          placeholder="家屋番号"
        />

        <select 
          placeholder="種類"
        />

        <input 
          placeholder="構造"
        />

        <input 
          placeholder="床面積"
        />

        <select>
          <option>より以上</option>
          <option>より以下</option>
        </select>

        <input
         type="date"
        />

        <select>
          <option>より以前</option>
          <option>より以後</option>
        </select>

        <input
         placeholder="建物名"
        />

        <p>一旦地番無　_に反応　別testに連結</p>
  
        <div>
          <button onClick={previousPage}>&lt;</button>
          <span>{currentPage}</span>/{totalPages}
          <button onClick={nextPage}>&gt;</button>
        </div>
  
        <select
          className="rounded"
          value={itemsPerPage}
          onChange={handleItemsPerPageChange}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
  
        <ul>
          {displayedFullNames.map((fullName, index) => (
            <li className="px-1 py-1 overflow-ellipsis" key={index}>
              {fullName}
              <button>座標</button>
            </li>
          ))}
        </ul>
        <MapContainer center={center} zoom={20} style={{ height: "100vh", width: "100%" }}>
          <TileLayer
            url="https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
            maxZoom={20}
            maxNativeZoom={18}
          />
          <MapEvents /> {/* <-- Add this */}
          {(zoomLevel === 19 || zoomLevel === 20) && data2.map((geojson, index) => <GeoJSON key={index} data={geojson}/>)}
        </MapContainer>
      </>
    );
  }
  