"""ML модель для оптимизации маршрутов на базе Graph Attention Network"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GATConv


class RouteNet(nn.Module):
    """
    Graph Attention Network для оптимизации маршрутов.

    Модель использует GAT (Graph Attention Network) для вычисления
    attention scores для каждого клиента, что помогает выбрать
    оптимальную следующую точку маршрута.
    """

    def __init__(self, in_dim: int, hid_dim: int = 128):
        """
        Инициализация модели.

        Args:
            in_dim: Размерность входных признаков (обычно 3: lat, lon, feature)
            hid_dim: Размерность скрытого слоя (по умолчанию 128)
        """
        super().__init__()

        # Первый GAT слой: 4 головы внимания
        self.gat1 = GATConv(in_dim, hid_dim, heads=4, concat=True)

        # Второй GAT слой: 2 головы внимания
        self.gat2 = GATConv(hid_dim * 4, hid_dim, heads=2, concat=False)

        # Полносвязный слой для получения финального score
        self.fc = nn.Linear(hid_dim, 1)

    def forward(self, data):
        """
        Прямой проход модели.

        Args:
            data: PyTorch Geometric Data объект с полями:
                - x: признаки узлов (координаты клиентов)
                - edge_index: граф соединений
                - edge_attr: признаки рёбер (опционально)

        Returns:
            attn: Attention scores для каждого узла (после softmax)
        """
        x, edge_index = data.x, data.edge_index

        # Первый GAT слой + ReLU
        h = F.relu(self.gat1(x, edge_index))

        # Второй GAT слой + ReLU
        h = F.relu(self.gat2(h, edge_index))

        # Вычисление scores
        scores = self.fc(h).squeeze(-1)

        # Softmax для получения attention weights
        attn = F.softmax(scores, dim=0)

        return attn
