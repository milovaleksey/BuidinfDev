import { Link } from '../components/ui/link';
import { buildingService } from '../services/BuildingService';
import { authService } from '../services/AuthService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Layers, Edit, Eye, Lock, Database, Calendar, RotateCcw, Download, Upload, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';

export function Dashboard() {
  const building = buildingService.getBuilding();
  const canEdit = authService.canEditFloors();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Show notification if data was loaded from storage
    if (buildingService.isFromStorage() && !isLoaded) {
      const updated = buildingService.getLastUpdated();
      setLastUpdated(updated);
      
      if (updated) {
        const date = new Date(updated);
        toast.success(`Конфигурация загружена из хранилища (обновлена: ${date.toLocaleString('ru-RU')})`);
      } else {
        toast.success('Конфигурация загружена из хранилища');
      }
      setIsLoaded(true);
    }
  }, [isLoaded]);

  const handleReset = () => {
    buildingService.resetToDefault();
    setIsResetDialogOpen(false);
    toast.success('Конфигурация сброшена. Перезагрузите страницу для применения.');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleExport = () => {
    buildingService.exportToJSON();
    toast.success('Конфигурация здания экспортирована');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await buildingService.importFromJSON(file);
      toast.success('Конфигурация импортирована. Перезагрузите страницу.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error((error as Error).message);
    }
    
    // Reset input
    e.target.value = '';
  };

  const stats = buildingService.getBuildingStats();

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{building.name}</h1>
            <p className="text-gray-600">Выберите этаж для просмотра или редактирования</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              className="rounded-2xl"
            >
              <Download className="mr-2 size-4" />
              Экспорт всего
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              onClick={() => importInputRef.current?.click()}
              variant="outline"
              className="rounded-2xl"
            >
              <Upload className="mr-2 size-4" />
              Импорт
            </Button>
            {canEdit && (
              <Button
                onClick={() => setIsResetDialogOpen(true)}
                variant="outline"
                className="rounded-2xl border-red-300 text-red-600 hover:bg-red-50"
              >
                <RotateCcw className="mr-2 size-4" />
                Сбросить
              </Button>
            )}
          </div>
        </div>

        {/* Info Banner */}
        {buildingService.isFromStorage() && (
          <Card className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 mb-6">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Database className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">Загружена сохраненная конфигурация</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-green-700">
                    {lastUpdated && (
                      <div className="flex items-center gap-1">
                        <Calendar className="size-4" />
                        <span>Обновлено: {new Date(lastUpdated).toLocaleString('ru-RU')}</span>
                      </div>
                    )}
                    <div>Этажей: {stats.totalFloors}</div>
                    <div>Помещений: {stats.totalRooms}</div>
                    <div>Устройств: {stats.totalDevices}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!buildingService.isFromStorage() && (
          <Card className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">Используется конфигурация по умолчанию</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Внесите изменения и сохраните, чтобы они загружались автоматически при следующем запуске
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {building.floors.map((floor) => {
          const totalDevices = floor.rooms.reduce((sum, room) => sum + room.devices.length, 0);
          const onlineDevices = floor.rooms.reduce(
            (sum, room) => sum + room.devices.filter(d => d.status === 'online').length,
            0
          );
          const accessibleRooms = floor.rooms.filter(room => 
            authService.hasRoomAccess(room.id)
          ).length;

          return (
            <Card key={floor.id} className="rounded-3xl shadow-lg hover:shadow-xl transition-all overflow-hidden group">
              <CardHeader className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <Layers className="size-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{floor.name}</CardTitle>
                      <CardDescription className="text-blue-100">
                        {floor.rooms.length} помещений
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Устройства</span>
                    <Badge variant={onlineDevices === totalDevices ? 'default' : 'secondary'} className="rounded-full">
                      {onlineDevices} / {totalDevices}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Доступ к помещениям</span>
                    <Badge variant="outline" className="rounded-full">
                      {accessibleRooms} / {floor.rooms.length}
                    </Badge>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Link to={`/dashboard/floors/${floor.id}`} className="flex-1">
                      <Button className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                        <Eye className="mr-2 size-4" />
                        Просмотр
                      </Button>
                    </Link>
                    {canEdit && (
                      <Link to={`/dashboard/floor-editor/${floor.id}`}>
                        <Button variant="outline" className="rounded-2xl">
                          <Edit className="size-4" />
                        </Button>
                      </Link>
                    )}
                  </div>

                  {accessibleRooms < floor.rooms.length && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-xl">
                      <Lock className="size-3" />
                      <span>Ограниченный доступ</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reset Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Сбросить конфигурацию</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите сбросить конфигурацию здания до значений по умолчанию? Это действие необратимо.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={handleReset}
              variant="outline"
              className="rounded-2xl border-red-300 text-red-600 hover:bg-red-50"
            >
              <RotateCcw className="mr-2 size-4" />
              Сбросить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}