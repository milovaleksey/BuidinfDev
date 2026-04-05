import { Link } from '../components/ui/link';
import { buildingSystemService } from '../services/BuildingSystemService';
import { authService } from '../services/AuthService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Building, Layers, Edit, Eye, Plus, MapPin, Trash2, ChevronRight, ChevronDown, Download, Upload, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import type { LocationType, Building as BuildingType } from '../types';

export function Locations() {
  const buildings = buildingSystemService.getAllBuildings();
  const canEdit = authService.canEditFloors();
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState<BuildingType | null>(null);
  const [floorToDelete, setFloorToDelete] = useState<{ floorId: string; floorName: string; buildingId: string } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [newLocationType, setNewLocationType] = useState<LocationType>('building');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [newFloorNumber, setNewFloorNumber] = useState('1');

  const toggleBuilding = (buildingId: string) => {
    const newExpanded = new Set(expandedBuildings);
    if (newExpanded.has(buildingId)) {
      newExpanded.delete(buildingId);
    } else {
      newExpanded.add(buildingId);
    }
    setExpandedBuildings(newExpanded);
  };

  const handleCreateLocation = () => {
    if (!newLocationName.trim()) {
      toast.error('Введите название локации');
      return;
    }

    if (newLocationType === 'building') {
      const newBuilding = buildingSystemService.createBuilding(newLocationName, newLocationAddress || undefined);
      toast.success(`Здание "${newLocationName}" создано`);
      setExpandedBuildings(new Set([newBuilding.id]));
      setIsCreateDialogOpen(false);
      resetForm();
      window.location.reload(); // Перезагружаем страницу для обновления данных
    }

    if (newLocationType === 'floor') {
      if (!selectedBuildingId) {
        toast.error('Выберите здание');
        return;
      }

      const floorNumber = parseInt(newFloorNumber);
      if (isNaN(floorNumber)) {
        toast.error('Введите корректный номер этажа');
        return;
      }

      const building = buildingSystemService.getBuilding(selectedBuildingId);
      if (building) {
        const existingFloor = building.floors.find(f => f.number === floorNumber);
        if (existingFloor) {
          toast.error(`Этаж ${floorNumber} уже существует в этом здании`);
          return;
        }

        buildingSystemService.addFloor(selectedBuildingId, newLocationName, floorNumber);
        toast.success(`Этаж "${newLocationName}" создан`);
        setIsCreateDialogOpen(false);
        resetForm();
        window.location.reload();
      }
    }
  };

  const handleDeleteBuilding = () => {
    if (!buildingToDelete) return;

    if (buildingToDelete.floors.length > 0) {
      toast.error('Удалите все этажи перед удалением здания');
      setIsDeleteDialogOpen(false);
      setBuildingToDelete(null);
      return;
    }

    if (buildings.length === 1) {
      toast.error('Невозможно удалить последнее здание');
      setIsDeleteDialogOpen(false);
      setBuildingToDelete(null);
      return;
    }

    buildingSystemService.deleteBuilding(buildingToDelete.id);
    toast.success(`Здание "${buildingToDelete.name}" удалено`);
    setIsDeleteDialogOpen(false);
    setBuildingToDelete(null);
    window.location.reload();
  };

  const handleDeleteFloor = () => {
    if (!floorToDelete) return;

    const building = buildingSystemService.getBuilding(floorToDelete.buildingId);
    const floor = building?.floors.find(f => f.id === floorToDelete.floorId);
    
    if (floor && floor.rooms.length > 0) {
      toast.error('Удалите все помещения перед удалением этажа');
      setIsDeleteDialogOpen(false);
      setFloorToDelete(null);
      return;
    }

    buildingSystemService.deleteFloor(floorToDelete.floorId);
    toast.success(`Этаж "${floorToDelete.floorName}" удален`);
    setIsDeleteDialogOpen(false);
    setFloorToDelete(null);
    window.location.reload();
  };

  const handleReset = () => {
    buildingSystemService.resetToDefault();
    toast.success('Система сброшена до начального состояния');
    setIsResetDialogOpen(false);
    window.location.reload();
  };

  const resetForm = () => {
    setNewLocationName('');
    setNewLocationAddress('');
    setSelectedBuildingId('');
    setNewFloorNumber('1');
    setNewLocationType('building');
  };

  const handleExport = () => {
    buildingSystemService.exportSystemToJSON();
    toast.success('Система зданий экспортирована');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await buildingSystemService.importBuildingFromJSON(file);
      toast.success('Здание импортировано. Перезагрузите страницу.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error((error as Error).message);
    }
    
    e.target.value = '';
  };

  const getBuildingStats = (building: BuildingType) => {
    return {
      floorsCount: building.floors.length,
      roomsCount: building.floors.reduce((sum, f) => sum + f.rooms.length, 0),
      devicesCount: building.floors.reduce((sum, f) => 
        sum + f.rooms.reduce((s, r) => s + r.devices.length, 0), 0
      ),
    };
  };

  const getFloorStats = (buildingId: string, floorId: string) => {
    const building = buildingSystemService.getBuilding(buildingId);
    const floor = building?.floors.find(f => f.id === floorId);
    return {
      roomsCount: floor?.rooms.length || 0,
      devicesCount: floor?.rooms.reduce((sum, r) => sum + r.devices.length, 0) || 0,
    };
  };

  const handleSelectBuilding = (buildingId: string) => {
    buildingSystemService.setCurrentBuilding(buildingId);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Локации</h1>
            <p className="text-gray-600">Управление зданиями и этажами</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
            <Button variant="outline" onClick={() => importInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Импорт
            </Button>
            {canEdit && (
              <>
                <Button variant="outline" onClick={() => setIsResetDialogOpen(true)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Сбросить
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Список зданий */}
      <div className="space-y-4">
        {buildings.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-gray-500">Нет зданий. Создайте первое здание.</p>
            </CardContent>
          </Card>
        ) : (
          buildings.map((building) => {
            const stats = getBuildingStats(building);
            const isExpanded = expandedBuildings.has(building.id);
            const isCurrent = buildingSystemService.getCurrentBuildingId() === building.id;

            return (
              <Card key={building.id} className={`overflow-hidden ${isCurrent ? 'border-blue-500 border-2' : ''}`}>
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleBuilding(building.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <Building className="w-6 h-6 text-blue-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{building.name}</CardTitle>
                          {isCurrent && (
                            <Badge variant="default">Текущее</Badge>
                          )}
                        </div>
                        {building.address && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {building.address}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                      {!isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectBuilding(building.id)}
                        >
                          Выбрать
                        </Button>
                      )}
                      <Badge variant="secondary">
                        <Layers className="w-3 h-3 mr-1" />
                        {stats.floorsCount} этажей
                      </Badge>
                      <Badge variant="secondary">
                        {stats.roomsCount} помещений
                      </Badge>
                      <Badge variant="secondary">
                        {stats.devicesCount} устройств
                      </Badge>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBuildingToDelete(building);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Этажи */}
                {isExpanded && (
                  <CardContent className="pt-4 space-y-2">
                    {building.floors.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Нет этажей. Создайте первый этаж.</p>
                    ) : (
                      building.floors.map((floor) => {
                        const floorStats = getFloorStats(building.id, floor.id);
                        return (
                          <div
                            key={floor.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <Layers className="w-5 h-5 text-gray-500" />
                              <div>
                                <h3 className="font-semibold">{floor.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {floorStats.roomsCount} помещений, {floorStats.devicesCount} устройств
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/floor/${floor.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Просмотр
                                </Link>
                              </Button>
                              {canEdit && (
                                <>
                                  <Button variant="outline" size="sm" asChild>
                                    <Link to={`/floor/${floor.id}/edit`}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Редактор
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setFloorToDelete({ 
                                        floorId: floor.id, 
                                        floorName: floor.name,
                                        buildingId: building.id
                                      });
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Диалог создания локации */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать локацию</DialogTitle>
            <DialogDescription>
              Добавьте новое здание или этаж
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="location-type">Тип локации</Label>
              <Select value={newLocationType} onValueChange={(v) => setNewLocationType(v as LocationType)}>
                <SelectTrigger id="location-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="building">Здание</SelectItem>
                  <SelectItem value="floor">Этаж</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newLocationType === 'floor' && (
              <div>
                <Label htmlFor="building-select">Здание</Label>
                <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                  <SelectTrigger id="building-select">
                    <SelectValue placeholder="Выберите здание" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="location-name">Название</Label>
              <Input
                id="location-name"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder={newLocationType === 'building' ? 'Название здания' : 'Название этажа'}
              />
            </div>

            {newLocationType === 'building' && (
              <div>
                <Label htmlFor="location-address">Адрес</Label>
                <Input
                  id="location-address"
                  value={newLocationAddress}
                  onChange={(e) => setNewLocationAddress(e.target.value)}
                  placeholder="Адрес здания"
                />
              </div>
            )}

            {newLocationType === 'floor' && (
              <div>
                <Label htmlFor="floor-number">Номер этажа</Label>
                <Input
                  id="floor-number"
                  type="number"
                  value={newFloorNumber}
                  onChange={(e) => setNewFloorNumber(e.target.value)}
                  placeholder="1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              resetForm();
            }}>
              Отмена
            </Button>
            <Button onClick={handleCreateLocation}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить {buildingToDelete ? 'здание' : 'этаж'}?</DialogTitle>
            <DialogDescription>
              {buildingToDelete ? (
                <>Вы уверены, что хотите удалить здание "{buildingToDelete.name}"? Это действие нельзя отменить.</>
              ) : floorToDelete ? (
                <>Вы уверены, что хотите удалить этаж "{floorToDelete.floorName}"? Это действие нельзя отменить.</>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setBuildingToDelete(null);
              setFloorToDelete(null);
            }}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={buildingToDelete ? handleDeleteBuilding : handleDeleteFloor}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог сброса */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сбросить систему?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите сбросить все здания до начального состояния?
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Сбросить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}