import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Box,
  Chip,
  Divider,
  Stack,
  Button,
  Dialog,
  DialogContent,
  TextField,
  DialogActions,
  DialogTitle,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  LocationOn,
} from "@mui/icons-material";
import { green, red, grey, blue } from "@mui/material/colors";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import customMarkerImage from "./train.png"; // Adjust the path to your custom marker image
import L from "leaflet";

export default function Home() {
  const [trainData, setTrainData] = useState([]);
  const [openRowIndex, setOpenRowIndex] = useState(null);
  const [open, setOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [trainName, setTrainName] = useState("");
  const [lineName, setLineName] = useState("");
  const [mapCenter, setMapCenter] = useState([0, 0]);

  // Create a custom icon
  const customIcon = L.icon({
    iconUrl: customMarkerImage,
    iconSize: [32, 32], // Size of the icon [width, height]
    iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -32], // Point from which the popup should open relative to the iconAnchor
  });

  useEffect(() => {
    // Fetch train data from the API
    const fetchData = async () => {
      try {
        const response = await axios.get("https://web-api-cw-production.up.railway.app/api/trains");
        const reversedData = response.data.reverse();
        setTrainData(reversedData);
      } catch (error) {
        console.error("Error fetching train data:", error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const handleRowClick = (index) => {
    setOpenRowIndex(openRowIndex === index ? null : index);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "https://web-api-cw-production.up.railway.app/api/trains/start",
        { trainName, lineName }
      );
      if (response.status === 200) {
        console.log("Train started successfully:", response.data);
      } else {
        console.error("Error starting train:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
    handleClose();
  };

  const handleMapOpen = (latitude, longitude) => {
    setMapCenter([latitude, longitude]);
    setMapOpen(true);
  };

  const handleMapClose = () => {
    setMapOpen(false);
  };

  // Function to format time to '2:15 PM'
  const formatTime = (time) => {
    if (!time) return "---";
    const date = new Date(time);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  return (
    <Container>
      <Box textAlign="center" mt={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sri Lanka Railways Live
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          mt: 4,
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: grey[200] }}>
              <TableCell />
              <TableCell>Train Name</TableCell>
              <TableCell align="right">Line</TableCell>
              <TableCell align="right">Status</TableCell>
              <TableCell align="right">Last Passed Location & Time</TableCell>
              <TableCell align="right">Latitude</TableCell>
              <TableCell align="right">Longitude</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {trainData.map((row, index) => (
              <React.Fragment key={index}>
                <TableRow
                  hover
                  onClick={() => handleRowClick(index)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: index % 2 === 0 ? grey[50] : "white",
                  }}
                >
                  <TableCell>
                    <IconButton size="small">
                      {openRowIndex === index ? (
                        <KeyboardArrowUp />
                      ) : (
                        <KeyboardArrowDown />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {row.trainName || "Unknown"}
                  </TableCell>
                  <TableCell align="right">{row.line || "Unknown"}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={row.status || "Unknown"}
                      style={{
                        backgroundColor:
                          row.status === "On Time" ? green[500] : red[500],
                        color: "white",
                      }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Box>
                      <Typography>
                        {row.currentStation?.name || "Unknown"}
                      </Typography>
                      <Typography variant="caption">
                        {formatTime(row.lastPassedTime)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {row.currentStation?.latitude || "---"}
                  </TableCell>
                  <TableCell align="right">
                    {row.currentStation?.longitude || "---"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      startIcon={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: blue[500],
                            color: "white",
                            borderRadius: "50%",
                            width: 24,
                            height: 24,
                            mr: 1,
                          }}
                        >
                          <LocationOn />
                        </Box>
                      }
                      onClick={() =>
                        handleMapOpen(
                          row.currentStation?.latitude || 0,
                          row.currentStation?.longitude || 0
                        )
                      }
                    >
                      Show on Map
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={10}
                  >
                    <Collapse
                      in={openRowIndex === index}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box margin={2}>
                        <Typography variant="h6" gutterBottom>
                          Station Details
                        </Typography>
                        <Divider />
                        <Table size="small" aria-label="stations">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: grey[100] }}>
                              <TableCell>Station</TableCell>
                              <TableCell align="right">Passed</TableCell>
                              <TableCell align="right">Time</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {row.passedStations?.map((station, i) => (
                              <TableRow key={i}>
                                <TableCell component="th" scope="row">
                                  {station?.station?.name || "Unknown"}
                                </TableCell>
                                <TableCell align="right">
                                  <Chip
                                    label="Yes"
                                    style={{
                                      backgroundColor: green[500],
                                      color: "white",
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {formatTime(station?.time)}
                                </TableCell>
                              </TableRow>
                            )) || (
                              <TableRow>
                                <TableCell colSpan={3} align="center">
                                  No stations passed yet
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Train Dialog */}
      <Stack direction="row" justifyContent="center" mt={4}>
        <Button variant="contained" color="primary" onClick={handleClickOpen}>
          Add Train
        </Button>
      </Stack>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add Train</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Train Name"
            fullWidth
            value={trainName}
            onChange={(e) => setTrainName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Line Name"
            fullWidth
            value={lineName}
            onChange={(e) => setLineName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Generate</Button>
        </DialogActions>
      </Dialog>

      {/* Map dialog */}
      <Dialog open={mapOpen} onClose={handleMapClose}>
        <DialogTitle>Train Location</DialogTitle>
        <DialogContent>
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: "400px", width: "600px" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={mapCenter} icon={customIcon}>
              <Popup>Train is here</Popup>
            </Marker>
          </MapContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMapClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}