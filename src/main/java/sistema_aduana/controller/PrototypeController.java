package sistema_aduana.controller;

import org.springframework.web.bind.annotation.*;
import sistema_aduana.storage.DataStore;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin("*")
public class PrototypeController {

    private String makeId(String prefijo) {
        int n = new Random().nextInt(9000) + 1000;
        return prefijo + "-" + n;
    }

    // =========================
    // HEALTH
    // =========================

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("ok", true);
    }

    // =========================
    // DASHBOARD / ESTADO
    // =========================

    @GetMapping("/estado")
    public Map<String, Object> estado() {

        long ingresos = DataStore.expedientes.stream()
                .filter(e -> "Aprobado".equals(e.get("estado")))
                .count();

        long egresos = DataStore.expedientes.stream()
                .filter(e -> "Registrado".equals(e.get("estado")))
                .count();

        long enProceso = DataStore.expedientes.stream()
                .filter(e -> "Revision".equals(e.get("estado")))
                .count();

        long retenidos = DataStore.expedientes.stream()
                .filter(e -> "Retenido".equals(e.get("estado")))
                .count();

        return Map.of(
                "ingresos", ingresos,
                "egresos", egresos,
                "enProceso", enProceso,
                "retenidos", retenidos,
                "totalUsuarios", DataStore.usuarios.size(),
                "totalMenores", DataStore.menores.size(),
                "totalVehiculos", DataStore.vehiculos.size(),
                "totalSAG", DataStore.sag.size(),
                "totalExpedientes", DataStore.expedientes.size()
        );
    }

    // =========================
    // USUARIOS
    // =========================

    @GetMapping("/usuarios")
    public List<Map<String, Object>> usuarios() {
        return DataStore.usuarios;
    }

    @PostMapping("/usuarios")
    public Map<String, Object> crearUsuario(
            @RequestBody Map<String, Object> usuario) {

        usuario.put("id", makeId("USR"));
        usuario.putIfAbsent("activo", true);
        usuario.putIfAbsent("creado", new Date().toString());

        DataStore.usuarios.add(usuario);

        return Map.of(
                "success", true,
                "data", usuario
        );
    }

    @DeleteMapping("/usuarios/{id}")
    public Map<String, Object> eliminarUsuario(
            @PathVariable String id) {

        DataStore.usuarios.removeIf(
                u -> Objects.equals(
                        String.valueOf(u.get("id")),
                        id
                )
        );

        return Map.of("success", true);
    }

    // =========================
    // MENORES
    // =========================

    @GetMapping("/menores")
    public List<Map<String, Object>> menores() {
        return DataStore.menores;
    }

    @PostMapping("/menores")
    public Map<String, Object> guardarMenor(
            @RequestBody Map<String, Object> menor) {

        menor.put("id", makeId("MEN"));
        menor.put("fecha", new Date().toString());

        boolean documentosOk =
                Boolean.TRUE.equals(
                        menor.get("documentosOk"));

        menor.put(
                "estado",
                documentosOk
                        ? "Aprobado"
                        : "Revision"
        );

        DataStore.menores.add(menor);

        Map<String, Object> expediente =
                new HashMap<>();

        expediente.put(
                "id",
                makeId("EXP")
        );
        expediente.put(
                "tipo",
                "Menor de edad"
        );
        expediente.put(
                "estado",
                menor.get("estado")
        );
        expediente.put(
                "fecha",
                menor.get("fecha")
        );

        DataStore.expedientes.add(
                expediente
        );

        return Map.of(
                "success", true,
                "data", menor
        );
    }

    @DeleteMapping("/menores/{id}")
    public Map<String, Object> eliminarMenor(
            @PathVariable String id) {

        DataStore.menores.removeIf(
                m -> Objects.equals(
                        String.valueOf(m.get("id")),
                        id
                )
        );

        return Map.of("success", true);
    }

    // =========================
    // VEHICULOS
    // =========================

    @GetMapping("/vehiculos")
    public List<Map<String, Object>> vehiculos() {
        return DataStore.vehiculos;
    }

    @PostMapping("/vehiculos")
    public Map<String, Object> guardarVehiculo(
            @RequestBody Map<String, Object> vehiculo) {

        vehiculo.put(
                "id",
                makeId("VEH")
        );

        vehiculo.putIfAbsent(
                "estado",
                "Registrado"
        );

        vehiculo.put(
                "fecha",
                new Date().toString()
        );

        DataStore.vehiculos.add(
                vehiculo
        );

        return Map.of(
                "success", true,
                "data", vehiculo
        );
    }

    @DeleteMapping("/vehiculos/{id}")
    public Map<String, Object> eliminarVehiculo(
            @PathVariable String id) {

        DataStore.vehiculos.removeIf(
                v -> Objects.equals(
                        String.valueOf(v.get("id")),
                        id
                )
        );

        return Map.of("success", true);
    }

    // =========================
    // SAG
    // =========================

    @GetMapping("/sag")
    public List<Map<String, Object>> sag() {
        return DataStore.sag;
    }

    @PostMapping("/sag")
    public Map<String, Object> guardarSag(
            @RequestBody Map<String, Object> registro) {

        registro.put(
                "id",
                makeId("SAG")
        );

        registro.put(
                "estado",
                "Enviado"
        );

        registro.put(
                "fecha",
                new Date().toString()
        );

        DataStore.sag.add(
                registro
        );

        return Map.of(
                "success", true,
                "data", registro
        );
    }

    @DeleteMapping("/sag/{id}")
    public Map<String, Object> eliminarSag(
            @PathVariable String id) {

        DataStore.sag.removeIf(
                s -> Objects.equals(
                        String.valueOf(s.get("id")),
                        id
                )
        );

        return Map.of("success", true);
    }

    // =========================
    // PDI
    // =========================

    @PostMapping("/pdi")
    public Map<String, Object> pdi(
            @RequestBody Map<String, Object> body) {

        Map<String, Object> respuesta =
                new HashMap<>();

        respuesta.put(
                "id",
                makeId("PDI")
        );
        respuesta.put(
                "fecha",
                new Date().toString()
        );
        respuesta.put(
                "datos",
                body
        );

        return Map.of(
                "success", true,
                "data", respuesta
        );
    }

    // =========================
    // EXPEDIENTES
    // =========================

    @GetMapping("/expedientes")
    public List<Map<String, Object>> expedientes() {

        List<Map<String, Object>> copia =
                new ArrayList<>(
                        DataStore.expedientes
                );

        Collections.reverse(copia);

        return copia;
    }

    @PostMapping("/expedientes")
    public Map<String, Object> guardarExpediente(
            @RequestBody Map<String, Object> expediente) {

        expediente.put(
                "id",
                makeId("EXP")
        );

        expediente.put(
                "fecha",
                new Date().toString()
        );

        DataStore.expedientes.add(
                expediente
        );

        return Map.of(
                "success", true,
                "data", expediente
        );
    }

    @DeleteMapping("/expedientes/{id}")
    public Map<String, Object> eliminarExpediente(
            @PathVariable String id) {

        DataStore.expedientes.removeIf(
                e -> Objects.equals(
                        String.valueOf(e.get("id")),
                        id
                )
        );

        return Map.of("success", true);
    }

    // =========================
    // REPORTES
    // =========================

    @GetMapping("/reportes")
    public Map<String, Object> reportes() {

        return Map.of(
                "success", true,
                "total",
                DataStore.expedientes.size(),
                "datos",
                DataStore.expedientes
        );
    }
}