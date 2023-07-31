import React,{ useState, useEffect } from "react";
import axios from "axios";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import Head from "next/head";
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet';
import wkx from 'wkx';
import 'leaflet/dist/leaflet.css';

const maincenter = [35.67843, 139.764603];

export default function MyComponent() {
    useEffect(() => {
        async function fetchData() {
          const response = await axios.get("http://172.16.52.128:5000/api");
          setData(response.data);
        }
        fetchData();
      }, []);

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
}