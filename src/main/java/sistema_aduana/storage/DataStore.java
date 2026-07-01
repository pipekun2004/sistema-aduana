package sistema_aduana.storage;

import java.util.*;

public class DataStore {

    public static final List<Map<String,Object>> usuarios = new ArrayList<>();
    public static final Map<String, Map<String,Object>> sesiones = new HashMap<>();

    public static final List<Map<String,Object>> expedientes = new ArrayList<>();
    public static final List<Map<String,Object>> sag = new ArrayList<>();
    public static final List<Map<String,Object>> vehiculos = new ArrayList<>();
    public static final List<Map<String,Object>> menores = new ArrayList<>();

    static {
    Map<String,Object> admin = new HashMap<>();

    admin.put("id", "USR-0001");
    admin.put("nombre", "Oscar");
    admin.put("apellido", "Garcia");
    admin.put("rut", "12.345.678-9");

    
    admin.put("user", "admin");
    admin.put("pass", "admin123");

    admin.put("usuario", "admin");
    admin.put("password", "admin123");

    admin.put("rol", "Administrador");
    admin.put("paso", "Los Libertadores");
    admin.put("activo", true);
    admin.put("initials", "OG");
    admin.put("creado", new Date().toString());

    usuarios.add(admin);
}
}
